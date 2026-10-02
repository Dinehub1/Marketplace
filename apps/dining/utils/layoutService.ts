import { supabase } from '../config/supabase';

// Types
export interface EventLayout {
  id: string;
  occurrence_id: string;
  event_id: string;
  slug: string;
  name: string;
  svg_url: string;
  viewbox: string | null;
  has_seat_map: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LayoutSection {
  id: string;
  layout_id: string;
  polygon_key: string;
  name: string;
  is_selectable: boolean;
  has_seat_map: boolean;
  fill_color: string | null;
  stroke_color: string | null;
  capacity_total: number;
  capacity_booked: number;
  status: 'active' | 'sold_out' | 'hidden';
  shape_type: 'rectangle' | 'circle' | 'polygon' | 'ellipse';
  polygon_points: string | null;
  bbox_x: number | null;
  bbox_y: number | null;
  bbox_width: number | null;
  bbox_height: number | null;
  metadata: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionWithAvailability extends LayoutSection {
  available_capacity: number;
  is_available: boolean;
}

/**
 * Fetch layout for a specific occurrence
 */
export const getLayoutForOccurrence = async (occurrenceId: string) => {
  try {
    console.log('📐 Fetching layout for occurrence:', occurrenceId);
    
    const { data, error } = await supabase
      .from('event_layouts')
      .select('*')
      .eq('occurrence_id', occurrenceId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error fetching layout:', error);
      return { data: null, error };
    }

    console.log('✅ Layout fetched:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exception fetching layout:', error);
    return { data: null, error };
  }
};

/**
 * Fetch all sections for a layout with availability calculation
 */
export const getSectionsForLayout = async (layoutId: string): Promise<{ data: SectionWithAvailability[] | null; error: any }> => {
  try {
    console.log('🎯 Fetching sections for layout:', layoutId);
    
    const { data, error } = await supabase
      .from('event_layout_sections')
      .select('*')
      .eq('layout_id', layoutId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching sections:', error);
      return { data: null, error };
    }

    // Calculate availability for each section
    const sectionsWithAvailability: SectionWithAvailability[] = data.map((section: LayoutSection) => ({
      ...section,
      available_capacity: section.capacity_total - section.capacity_booked,
      is_available: section.is_selectable && section.status === 'active' && (section.capacity_total - section.capacity_booked) > 0,
    }));

    console.log('✅ Sections fetched:', sectionsWithAvailability.length);
    return { data: sectionsWithAvailability, error: null };
  } catch (error) {
    console.error('❌ Exception fetching sections:', error);
    return { data: null, error };
  }
};

/**
 * Fetch tickets for a specific section
 */
export const getTicketsForSection = async (sectionId: string, occurrenceId: string) => {
  try {
    console.log('🎫 Fetching tickets for section:', sectionId);
    
    const { data, error } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('layout_section_id', sectionId)
      .eq('occurrence_id', occurrenceId)
      .eq('is_active', true)
      .order('price', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tickets:', error);
      return { data: null, error };
    }

    console.log('✅ Tickets fetched:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exception fetching tickets:', error);
    return { data: null, error };
  }
};

/**
 * Get section by polygon key
 */
export const getSectionByPolygonKey = (sections: SectionWithAvailability[], polygonKey: string): SectionWithAvailability | undefined => {
  return sections.find(section => section.polygon_key === polygonKey);
};

/**
 * Calculate total capacity for all sections
 */
export const getTotalCapacity = (sections: LayoutSection[]): { total: number; booked: number; available: number } => {
  const total = sections.reduce((sum, section) => sum + section.capacity_total, 0);
  const booked = sections.reduce((sum, section) => sum + section.capacity_booked, 0);
  const available = total - booked;
  
  return { total, booked, available };
};

/**
 * Get section color based on availability
 */
export const getSectionColor = (section: SectionWithAvailability | undefined, isInDatabase: boolean): string => {
  if (!isInDatabase || !section) {
    return '#333333'; // Dark gray for sections not in database
  }
  
  if (section.status === 'sold_out' || section.available_capacity === 0) {
    return '#bcbcbc'; // Gray for sold out
  }
  
  if (!section.is_selectable || section.status === 'hidden') {
    return '#666666'; // Medium gray for non-selectable
  }
  
  // Return the original color from database
  return section.fill_color || '#10b981'; // Default to green if no color
};

/**
 * Get section status text
 */
export const getSectionStatusText = (section: SectionWithAvailability): string => {
  if (section.status === 'sold_out' || section.available_capacity === 0) {
    return 'SOLD OUT';
  }
  
  if (section.available_capacity < 10) {
    return `${section.available_capacity} LEFT`;
  }
  
  return 'AVAILABLE';
};

/**
 * Get bounding box coordinates from section
 * Returns null if any coordinate is missing
 */
export const getSectionBoundingBox = (section: LayoutSection): { x: number; y: number; width: number; height: number } | null => {
  if (
    section.bbox_x === null || section.bbox_x === undefined ||
    section.bbox_y === null || section.bbox_y === undefined ||
    section.bbox_width === null || section.bbox_width === undefined ||
    section.bbox_height === null || section.bbox_height === undefined
  ) {
    console.warn(`⚠️ Section ${section.polygon_key} missing bounding box data`);
    return null;
  }

  return {
    x: Number(section.bbox_x),
    y: Number(section.bbox_y),
    width: Number(section.bbox_width),
    height: Number(section.bbox_height),
  };
};

/**
 * Check if a point is inside a section (shape-aware)
 */
export const isPointInSection = (x: number, y: number, section: LayoutSection): boolean => {
  const shapeType = section.shape_type || 'rectangle';

  switch (shapeType) {
    case 'circle':
      return isPointInCircle(x, y, section.polygon_points);
    case 'polygon':
      return isPointInPolygon(x, y, section.polygon_points);
    case 'ellipse':
      return isPointInEllipse(x, y, section.polygon_points);
    case 'rectangle':
    default:
      return isPointInRectangle(x, y, section);
  }
};

/**
 * Point in rectangle detection
 */
function isPointInRectangle(x: number, y: number, section: LayoutSection): boolean {
  if (!section.bbox_x || !section.bbox_y || !section.bbox_width || !section.bbox_height) {
    return false;
  }
  return (
    x >= section.bbox_x &&
    x <= section.bbox_x + section.bbox_width &&
    y >= section.bbox_y &&
    y <= section.bbox_y + section.bbox_height
  );
}

/**
 * Point in circle detection
 * polygon_points format: "cx,cy,radius"
 */
function isPointInCircle(x: number, y: number, polygonPoints: string | null): boolean {
  if (!polygonPoints) return false;
  
  const [cx, cy, radius] = polygonPoints.split(',').map(Number);
  const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
  return distance <= radius;
}

/**
 * Point in ellipse detection
 * polygon_points format: "cx,cy,rx,ry"
 */
function isPointInEllipse(x: number, y: number, polygonPoints: string | null): boolean {
  if (!polygonPoints) return false;
  
  const [cx, cy, rx, ry] = polygonPoints.split(',').map(Number);
  const normalizedX = (x - cx) / rx;
  const normalizedY = (y - cy) / ry;
  return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
}

/**
 * Point in polygon detection using ray casting algorithm
 * polygon_points format: "x1,y1 x2,y2 x3,y3..."
 */
function isPointInPolygon(x: number, y: number, polygonPoints: string | null): boolean {
  if (!polygonPoints) return false;
  
  const points = polygonPoints.split(' ').map(pair => {
    const [px, py] = pair.split(',').map(Number);
    return { x: px, y: py };
  });

  if (points.length < 3) return false;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

