/**
 * 地图相关工具函数
 */

// 上海市中心坐标
export const SHANGHAI_CENTER: [number, number] = [121.4737, 31.2304];

/**
 * 计算两点之间的距离（使用Haversine公式）
 * @param lat1 纬度1
 * @param lon1 经度1
 * @param lat2 纬度2
 * @param lon2 经度2
 * @returns 距离（米）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 计算路径总距离
 * @param coordinates 坐标数组 [经度, 纬度]
 * @returns 总距离（米）
 */
export function calculateRouteDistance(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1];
    const [lon2, lat2] = coordinates[i];
    totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
  }

  return totalDistance;
}

/**
 * 获取路径的边界框
 * @param coordinates 坐标数组
 * @returns 边界框 [minLon, minLat, maxLon, maxLat]
 */
export function getBounds(coordinates: [number, number][]): [number, number, number, number] {
  if (coordinates.length === 0) {
    return [...SHANGHAI_CENTER, ...SHANGHAI_CENTER] as [number, number, number, number];
  }

  let minLon = coordinates[0][0];
  let maxLon = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  coordinates.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return [minLon, minLat, maxLon, maxLat];
}

/**
 * 简化路径（Douglas-Peucker算法）
 * @param coordinates 原始坐标数组
 * @param tolerance 容差值
 * @returns 简化后的坐标数组
 */
export function simplifyPath(
  coordinates: [number, number][],
  tolerance: number = 0.0001
): [number, number][] {
  if (coordinates.length <= 2) return coordinates;

  const sqTolerance = tolerance * tolerance;

  function getSqDist(p1: [number, number], p2: [number, number]): number {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
  }

  function getSqSegDist(
    p: [number, number],
    p1: [number, number],
    p2: [number, number]
  ): number {
    let [x, y] = p1;
    let dx = p2[0] - x;
    let dy = p2[1] - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

      if (t > 1) {
        x = p2[0];
        y = p2[1];
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p[0] - x;
    dy = p[1] - y;

    return dx * dx + dy * dy;
  }

  function simplifyDouglasPeucker(
    coords: [number, number][],
    first: number,
    last: number,
    sqTol: number,
    simplified: [number, number][]
  ): void {
    let maxSqDist = sqTol;
    let index = 0;

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(coords[i], coords[first], coords[last]);

      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTol) {
      if (index - first > 1) {
        simplifyDouglasPeucker(coords, first, index, sqTol, simplified);
      }
      simplified.push(coords[index]);
      if (last - index > 1) {
        simplifyDouglasPeucker(coords, index, last, sqTol, simplified);
      }
    }
  }

  const last = coordinates.length - 1;
  const simplified: [number, number][] = [coordinates[0]];
  simplifyDouglasPeucker(coordinates, 0, last, sqTolerance, simplified);
  simplified.push(coordinates[last]);

  return simplified;
}

/**
 * 检查坐标是否在上海市范围内
 * @param lon 经度
 * @param lat 纬度
 * @returns 是否在上海市范围内
 */
export function isInShanghai(lon: number, lat: number): boolean {
  // 上海市大致边界
  const bounds = {
    minLon: 120.8,
    maxLon: 122.2,
    minLat: 30.7,
    maxLat: 31.9
  };

  return (
    lon >= bounds.minLon &&
    lon <= bounds.maxLon &&
    lat >= bounds.minLat &&
    lat <= bounds.maxLat
  );
}

/**
 * 生成模拟GPS轨迹（用于演示）
 * @param start 起始坐标
 * @param distance 距离（米）
 * @param points 轨迹点数量
 * @returns 模拟轨迹坐标数组
 */
export function generateMockRoute(
  start: [number, number] = SHANGHAI_CENTER,
  distance: number = 5000,
  points: number = 50
): [number, number][] {
  const coordinates: [number, number][] = [start];
  const stepDistance = distance / points;
  
  let currentLon = start[0];
  let currentLat = start[1];
  
  for (let i = 1; i < points; i++) {
    // 随机方向变化
    const angle = (Math.random() - 0.5) * Math.PI / 4; // ±45度
    const stepLon = (stepDistance / 111320) * Math.cos(angle); // 经度步长
    const stepLat = (stepDistance / 110540) * Math.sin(angle); // 纬度步长
    
    currentLon += stepLon;
    currentLat += stepLat;
    
    coordinates.push([currentLon, currentLat]);
  }
  
  return coordinates;
}

/**
 * 格式化坐标为字符串
 * @param coordinates 坐标数组
 * @returns 格式化的坐标字符串
 */
export function formatCoordinates(coordinates: [number, number][]): string {
  return coordinates
    .map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`)
    .join(';');
}

/**
 * 解析坐标字符串
 * @param coordString 坐标字符串
 * @returns 坐标数组
 */
export function parseCoordinates(coordString: string): [number, number][] {
  return coordString
    .split(';')
    .map(coord => {
      const [lon, lat] = coord.split(',').map(Number);
      return [lon, lat] as [number, number];
    });
}