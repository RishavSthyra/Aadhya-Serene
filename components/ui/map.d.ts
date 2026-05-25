import type * as React from "react";

export type MapRef = {
  flyTo?: (options: Record<string, unknown>) => void;
  easeTo?: (options: Record<string, unknown>) => void;
  fitBounds?: (
    bounds: [[number, number], [number, number]],
    options?: Record<string, unknown>,
  ) => void;
  getZoom?: () => number;
  on?: (...args: unknown[]) => void;
  off?: (...args: unknown[]) => void;
  getSource?: (...args: unknown[]) => unknown;
  getLayer?: (...args: unknown[]) => unknown;
  addSource?: (...args: unknown[]) => void;
  addLayer?: (...args: unknown[]) => void;
  removeLayer?: (...args: unknown[]) => void;
  removeSource?: (...args: unknown[]) => void;
  setPaintProperty?: (...args: unknown[]) => void;
  queryRenderedFeatures?: (...args: unknown[]) => unknown[];
  getCanvas?: () => { style: { cursor: string } };
};

export type MapViewport = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

export const Map: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Record<string, unknown>> & React.RefAttributes<MapRef>
>;

export function useMap(): {
  map: MapRef | null;
  isLoaded: boolean;
};

export const MapMarker: React.ComponentType<Record<string, unknown>>;
export const MarkerContent: React.ComponentType<Record<string, unknown>>;
export const MarkerPopup: React.ComponentType<Record<string, unknown>>;
export const MarkerTooltip: React.ComponentType<Record<string, unknown>>;
export const MarkerLabel: React.ComponentType<Record<string, unknown>>;
export const MapPopup: React.ComponentType<Record<string, unknown>>;
export const MapControls: React.ComponentType<Record<string, unknown>>;
export const MapRoute: React.ComponentType<Record<string, unknown>>;
export function MapClusterLayer(props: {
  data: string | object;
  clusterMaxZoom?: number;
  clusterRadius?: number;
  clusterColors?: string[];
  clusterThresholds?: number[];
  pointColor?: string;
  onPointClick?: (feature: { properties: Record<string, unknown> }, coordinates: [number, number]) => void;
  onClusterClick?: (clusterId: number, coordinates: [number, number], pointCount: number) => void;
}): React.JSX.Element;
