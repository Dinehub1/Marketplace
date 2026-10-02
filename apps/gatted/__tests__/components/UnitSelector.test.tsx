import { UnitSelector } from '@/components';
import { supabase } from '@/lib/supabase';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/lib/supabase');

// Rows as returned by the units query with the joined blocks relation
const mockUnitRows = [
    { id: 'unit-1', unit_number: 'A-101', floor: 1, block_id: 'block-1', blocks: { id: 'block-1', name: 'A' } },
    { id: 'unit-2', unit_number: 'A-102', floor: 1, block_id: 'block-1', blocks: { id: 'block-1', name: 'A' } },
    { id: 'unit-3', unit_number: 'B-201', floor: 2, block_id: 'block-2', blocks: { id: 'block-2', name: 'B' } },
];

// Builds a thenable query chain so select/eq/order can be chained and awaited
function mockUnitsQuery(result: { data: any; error: any }) {
    const chain: any = {
        select: jest.fn(() => chain),
        eq: jest.fn(() => chain),
        order: jest.fn(() => chain),
        then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
    };
    (supabase.from as jest.Mock).mockReturnValue(chain);
    return chain;
}

describe('UnitSelector', () => {
    const mockOnSelect = jest.fn();
    const mockSocietyId = 'society-123';

    beforeEach(() => {
        jest.clearAllMocks();
        mockUnitsQuery({ data: mockUnitRows, error: null });
    });

    it('should render placeholder before a unit is selected', () => {
        const { getByText } = render(
            <UnitSelector societyId={mockSocietyId} onSelect={mockOnSelect} />
        );

        expect(getByText('Select Unit')).toBeTruthy();
    });

    it('should load units and show blocks when opened', async () => {
        const { getByText } = render(
            <UnitSelector societyId={mockSocietyId} onSelect={mockOnSelect} />
        );

        fireEvent.press(getByText('Select Unit'));

        await waitFor(() => {
            expect(getByText('Select Block')).toBeTruthy();
        });

        expect(supabase.from).toHaveBeenCalledWith('units');
        expect(getByText('Block A')).toBeTruthy();
        expect(getByText('Block B')).toBeTruthy();
    });

    it('should call onSelect after drilling down block, floor, and unit', async () => {
        const { getByText } = render(
            <UnitSelector societyId={mockSocietyId} onSelect={mockOnSelect} />
        );

        fireEvent.press(getByText('Select Unit'));

        await waitFor(() => {
            expect(getByText('Block A')).toBeTruthy();
        });

        fireEvent.press(getByText('Block A'));
        fireEvent.press(getByText('Floor 1'));
        fireEvent.press(getByText('A-101'));

        expect(mockOnSelect).toHaveBeenCalledWith('unit-1', 'A-101');
    });

    it('should show empty state when units fail to load', async () => {
        mockUnitsQuery({ data: null, error: new Error('Failed to load units') });

        const { getByText } = render(
            <UnitSelector societyId={mockSocietyId} onSelect={mockOnSelect} />
        );

        fireEvent.press(getByText('Select Unit'));

        await waitFor(() => {
            expect(getByText('No units found')).toBeTruthy();
        });
    });
});
