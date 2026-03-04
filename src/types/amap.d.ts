// 高德地图API类型定义
declare global {
  interface Window {
    AMap: any;
  }
}

export interface AmapLatLng {
  lat: number;
  lng: number;
}

export interface AmapSize {
  width: number;
  height: number;
}

export interface AmapIcon {
  image: string;
  size: AmapSize;
  imageSize?: AmapSize;
  anchor?: string;
}

export interface AmapMarkerOptions {
  position: [number, number] | AmapLatLng;
  icon?: AmapIcon | string;
  title?: string;
  content?: string;
  draggable?: boolean;
  cursor?: string;
  visible?: boolean;
  zIndex?: number;
  angle?: number;
  autoRotation?: boolean;
  animation?: string;
  shadow?: AmapIcon;
  clickable?: boolean;
  extData?: any;
}

export interface AmapMapOptions {
  center?: [number, number] | AmapLatLng;
  zoom?: number;
  rotation?: number;
  pitch?: number;
  viewMode?: '2D' | '3D';
  features?: string[];
  layers?: any[];
  zooms?: [number, number];
  dragEnable?: boolean;
  zoomEnable?: boolean;
  jogEnable?: boolean;
  pitchEnable?: boolean;
  rotateEnable?: boolean;
  animateEnable?: boolean;
  keyboardEnable?: boolean;
  doubleClickZoom?: boolean;
  scrollWheel?: boolean;
  touchZoom?: boolean;
  touchZoomCenter?: number;
  mapStyle?: string;
  wallColor?: string;
  roofColor?: string;
  showLabel?: boolean;
  defaultCursor?: string;
  isHotspot?: boolean;
  hotspotTolerance?: number;
  labelzIndex?: number;
}

export interface AmapWalkingOptions {
  map?: any;
  panel?: string | HTMLElement;
  hideMarkers?: boolean;
  showTraffic?: boolean;
  province?: string;
  city?: string;
  autoFitView?: boolean;
}

export interface AmapPlaceSearchOptions {
  map?: any;
  panel?: string | HTMLElement;
  pageSize?: number;
  pageIndex?: number;
  city?: string;
  citylimit?: boolean;
  children?: number;
  type?: string;
  lang?: string;
  autoFitView?: boolean;
}

export interface AmapGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  convert?: boolean;
  showButton?: boolean;
  buttonDom?: string | HTMLElement;
  buttonPosition?: string;
  buttonOffset?: [number, number];
  showMarker?: boolean;
  markerOptions?: AmapMarkerOptions;
  showCircle?: boolean;
  circleOptions?: any;
  panToLocation?: boolean;
  zoomToAccuracy?: boolean;
  useNative?: boolean;
  getCityWhenFail?: boolean;
  needAddress?: boolean;
  extensions?: string;
}

export {};