import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface Unit {
    id: string;
    unit_number: string;
    block?: string;
    block_id?: string;
    floor?: number;
}

interface RecentUnit {
    id: string;
    unitNumber: string;
}

export interface UnitSelectorProps {
    label?: string;
    societyId: string;
    value?: string;
    onSelect: (unitId: string, unitNumber: string) => void;
    error?: string;
    containerStyle?: ViewStyle;
    required?: boolean;
    recentUnits?: RecentUnit[];
}

export function UnitSelector({
    label,
    societyId,
    value,
    onSelect,
    error,
    containerStyle,
    required,
    recentUnits = [],
}: UnitSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);

    // Selection state
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    // Load units when modal opens

    // Set display value from external value
    useEffect(() => {
        if (value && units.length > 0) {
            const unit = units.find(u => u.id === value);
            if (unit) setSelectedUnit(unit);
        }
    }, [value, units]);

    const loadUnits = useCallback(async () => {
        setIsLoading(true);
        try {
            // Join with blocks table to get block name
            const { data, error } = await supabase
                .from('units')
                .select(`
                    id, 
                    unit_number, 
                    floor,
                    block_id,
                    blocks:block_id (
                        id,
                        name
                    )
                `)
                .eq('society_id', societyId)
                .order('floor')
                .order('unit_number');

            if (error) throw error;

            // Transform data to include block name
            const transformedUnits: Unit[] = (data || []).map((unit: any) => ({
                id: unit.id,
                unit_number: unit.unit_number,
                floor: unit.floor,
                block_id: unit.block_id,
                block: unit.blocks?.name || undefined,
            }));

            // Sort by block name, then floor, then unit number
            transformedUnits.sort((a, b) => {
                if (a.block && b.block && a.block !== b.block) {
                    return a.block.localeCompare(b.block);
                }
                if (a.floor !== undefined && b.floor !== undefined && a.floor !== b.floor) {
                    return a.floor - b.floor;
                }
                return a.unit_number.localeCompare(b.unit_number);
            });

            setUnits(transformedUnits);
        } catch (err) {
            console.error('Error loading units:', err);
        } finally {
            setIsLoading(false);
        }
    }, [societyId]);

    useEffect(() => {
        if (isOpen && societyId) {
            loadUnits();
        }
    }, [isOpen, societyId, loadUnits]);

    // Extract unique blocks
    const blocks = useMemo(() => {
        const blockSet = new Set<string>();
        units.forEach(unit => {
            if (unit.block) blockSet.add(unit.block);
        });
        return Array.from(blockSet).sort();
    }, [units]);

    // Extract floors for selected block
    const floors = useMemo(() => {
        if (!selectedBlock) return [];
        const floorSet = new Set<number>();
        units
            .filter(unit => unit.block === selectedBlock)
            .forEach(unit => {
                if (unit.floor !== undefined) floorSet.add(unit.floor);
            });
        return Array.from(floorSet).sort((a, b) => a - b);
    }, [units, selectedBlock]);

    // Filter units for selected block and floor
    const filteredUnits = useMemo(() => {
        return units.filter(unit => {
            if (selectedBlock && unit.block !== selectedBlock) return false;
            if (selectedFloor !== null && unit.floor !== selectedFloor) return false;
            return true;
        });
    }, [units, selectedBlock, selectedFloor]);

    const handleBlockSelect = (block: string) => {
        setSelectedBlock(block);
        setSelectedFloor(null);
    };

    const handleFloorSelect = (floor: number) => {
        setSelectedFloor(floor);
    };

    const handleUnitSelect = (unit: Unit) => {
        setSelectedUnit(unit);
        onSelect(unit.id, unit.unit_number);
        setIsOpen(false);
        // Reset selection state
        setSelectedBlock(null);
        setSelectedFloor(null);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedBlock(null);
        setSelectedFloor(null);
    };

    const getDisplayValue = () => {
        if (selectedUnit) return selectedUnit.unit_number;
        return 'Select Unit';
    };

    const getCurrentStep = (): 'block' | 'floor' | 'unit' => {
        if (blocks.length === 0) return 'unit';
        if (!selectedBlock) return 'block';
        if (floors.length > 0 && selectedFloor === null) return 'floor';
        return 'unit';
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}
            <TouchableOpacity
                style={[styles.selector, error && styles.selectorError]}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="home-outline" size={20} color="#64748b" style={styles.icon} />
                <Text style={[styles.selectorText, !selectedUnit && styles.placeholder]}>
                    {getDisplayValue()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={isOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleClose}
            >
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {getCurrentStep() === 'block' && 'Select Block'}
                            {getCurrentStep() === 'floor' && `Block ${selectedBlock} - Select Floor`}
                            {getCurrentStep() === 'unit' && 'Select Unit'}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Breadcrumb */}
                    {(selectedBlock || selectedFloor !== null) && (
                        <View style={styles.breadcrumb}>
                            {selectedBlock && (
                                <TouchableOpacity
                                    style={styles.breadcrumbItem}
                                    onPress={() => {
                                        setSelectedBlock(null);
                                        setSelectedFloor(null);
                                    }}
                                >
                                    <Text style={styles.breadcrumbText}>Block {selectedBlock}</Text>
                                    <Ionicons name="close-circle" size={16} color="#3b82f6" />
                                </TouchableOpacity>
                            )}
                            {selectedFloor !== null && (
                                <TouchableOpacity
                                    style={styles.breadcrumbItem}
                                    onPress={() => setSelectedFloor(null)}
                                >
                                    <Text style={styles.breadcrumbText}>Floor {selectedFloor}</Text>
                                    <Ionicons name="close-circle" size={16} color="#3b82f6" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {isLoading ? (
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={styles.loadingText}>Loading units...</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.optionsList}>
                            {/* Recent Units Quick Select */}
                            {recentUnits.length > 0 && getCurrentStep() === 'block' && (
                                <View style={styles.recentUnitsSection}>
                                    <Text style={styles.recentUnitsTitle}>Recent Units</Text>
                                    <View style={styles.recentUnitsChips}>
                                        {recentUnits.map((recent) => (
                                            <TouchableOpacity
                                                key={recent.id}
                                                style={styles.recentUnitChip}
                                                onPress={() => {
                                                    const unit = units.find(u => u.id === recent.id);
                                                    if (unit) {
                                                        handleUnitSelect(unit);
                                                    } else {
                                                        // If not loaded yet, just use the recent data
                                                        onSelect(recent.id, recent.unitNumber);
                                                        setSelectedUnit({ id: recent.id, unit_number: recent.unitNumber });
                                                        setIsOpen(false);
                                                    }
                                                }}
                                            >
                                                <Text style={styles.recentUnitChipText}>{recent.unitNumber}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Show blocks */}
                            {getCurrentStep() === 'block' && blocks.map(block => (
                                <TouchableOpacity
                                    key={block}
                                    style={styles.optionItem}
                                    onPress={() => handleBlockSelect(block)}
                                >
                                    <View style={styles.optionIcon}>
                                        <Ionicons name="business-outline" size={24} color="#3b82f6" />
                                    </View>
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionTitle}>Block {block}</Text>
                                        <Text style={styles.optionSubtitle}>
                                            {units.filter(u => u.block === block).length} units
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            ))}

                            {/* Show floors */}
                            {getCurrentStep() === 'floor' && floors.map(floor => (
                                <TouchableOpacity
                                    key={floor}
                                    style={styles.optionItem}
                                    onPress={() => handleFloorSelect(floor)}
                                >
                                    <View style={styles.optionIcon}>
                                        <Ionicons name="layers-outline" size={24} color="#3b82f6" />
                                    </View>
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionTitle}>Floor {floor}</Text>
                                        <Text style={styles.optionSubtitle}>
                                            {units.filter(u => u.block === selectedBlock && u.floor === floor).length} units
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            ))}

                            {/* Show units */}
                            {getCurrentStep() === 'unit' && filteredUnits.map(unit => (
                                <TouchableOpacity
                                    key={unit.id}
                                    style={[
                                        styles.optionItem,
                                        selectedUnit?.id === unit.id && styles.optionSelected
                                    ]}
                                    onPress={() => handleUnitSelect(unit)}
                                >
                                    <View style={[
                                        styles.optionIcon,
                                        selectedUnit?.id === unit.id && styles.optionIconSelected
                                    ]}>
                                        <Ionicons
                                            name="home"
                                            size={24}
                                            color={selectedUnit?.id === unit.id ? '#fff' : '#3b82f6'}
                                        />
                                    </View>
                                    <View style={styles.optionContent}>
                                        <Text style={[
                                            styles.optionTitle,
                                            selectedUnit?.id === unit.id && styles.optionTitleSelected
                                        ]}>
                                            {unit.unit_number}
                                        </Text>
                                        {unit.block && (
                                            <Text style={styles.optionSubtitle}>
                                                Block {unit.block}{unit.floor !== undefined ? `, Floor ${unit.floor}` : ''}
                                            </Text>
                                        )}
                                    </View>
                                    {selectedUnit?.id === unit.id && (
                                        <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                                    )}
                                </TouchableOpacity>
                            ))}

                            {filteredUnits.length === 0 && !isLoading && (
                                <View style={styles.emptyState}>
                                    <Ionicons name="home-outline" size={48} color="#94a3b8" />
                                    <Text style={styles.emptyText}>No units found</Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectorError: {
        borderColor: '#ef4444',
    },
    icon: {
        marginRight: 12,
    },
    selectorText: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    placeholder: {
        color: '#94a3b8',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    modal: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    closeButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    breadcrumb: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 8,
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    breadcrumbText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
    },
    optionsList: {
        flex: 1,
        paddingVertical: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 4,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    optionSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionIconSelected: {
        backgroundColor: '#3b82f6',
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    optionTitleSelected: {
        color: '#3b82f6',
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 12,
    },
    recentUnitsSection: {
        marginHorizontal: 16,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    recentUnitsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recentUnitsChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    recentUnitChip: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    recentUnitChipText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
});
