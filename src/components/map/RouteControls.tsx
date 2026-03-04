/**
 * 路线控制组件
 * 提供路线规划、导航控制、途径点管理等功能
 */

import React, { useState, useRef } from 'react';
import { 
  MapPin, 
  Route, 
  Navigation, 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Upload,
  Download,
  Plus,
  Minus,
  Target,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { WaypointData, RouteData } from '../../types/map';

export interface RouteControlsProps {
  /** 当前途径点列表 */
  waypoints: WaypointData[];
  /** 当前路线 */
  currentRoute?: RouteData | null;
  /** 是否正在导航 */
  isNavigating: boolean;
  /** 是否正在追踪 */
  isTracking: boolean;
  /** 语音导航是否启用 */
  voiceEnabled: boolean;
  /** 是否禁用控件 */
  disabled?: boolean;
  /** 添加途径点回调 */
  onAddWaypoint?: (waypoint: Omit<WaypointData, 'id'>) => void;
  /** 移除途径点回调 */
  onRemoveWaypoint?: (waypointId: string) => void;
  /** 清除所有途径点回调 */
  onClearWaypoints?: () => void;
  /** 规划路线回调 */
  onPlanRoute?: () => void;
  /** 开始导航回调 */
  onStartNavigation?: () => void;
  /** 停止导航回调 */
  onStopNavigation?: () => void;
  /** 开始追踪回调 */
  onStartTracking?: () => void;
  /** 停止追踪回调 */
  onStopTracking?: () => void;
  /** 清除路线回调 */
  onClearRoute?: () => void;
  /** 切换语音导航回调 */
  onToggleVoice?: () => void;
  /** 自适应显示回调 */
  onFitView?: () => void;
  /** 导入途径点回调 */
  onImportWaypoints?: (waypoints: WaypointData[]) => void;
  /** 导出途径点回调 */
  onExportWaypoints?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  waypoints,
  currentRoute,
  isNavigating,
  isTracking,
  voiceEnabled,
  disabled = false,
  onAddWaypoint,
  onRemoveWaypoint,
  onClearWaypoints,
  onPlanRoute,
  onStartNavigation,
  onStopNavigation,
  onStartTracking,
  onStopTracking,
  onClearRoute,
  onToggleVoice,
  onFitView,
  onImportWaypoints,
  onExportWaypoints,
  className = '',
  style = {}
}) => {
  const [showWaypointForm, setShowWaypointForm] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({
    name: '',
    lat: '',
    lng: '',
    desc: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 添加途径点
   */
  const handleAddWaypoint = () => {
    if (!newWaypoint.name || !newWaypoint.lat || !newWaypoint.lng) {
      alert('请填写完整的途径点信息');
      return;
    }

    const lat = parseFloat(newWaypoint.lat);
    const lng = parseFloat(newWaypoint.lng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('请输入有效的经纬度');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('经纬度超出有效范围');
      return;
    }

    const waypoint: Omit<WaypointData, 'id'> = {
      name: newWaypoint.name,
      lat,
      lng,
      desc: newWaypoint.desc || '',
      type: 'waypoint'
    };

    onAddWaypoint?.(waypoint);

    // 重置表单
    setNewWaypoint({ name: '', lat: '', lng: '', desc: '' });
    setShowWaypointForm(false);
  };

  /**
   * 处理文件导入
   */
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedWaypoints = parseCSV(content);
        
        if (importedWaypoints.length > 0) {
          onImportWaypoints?.(importedWaypoints);
          alert(`成功导入 ${importedWaypoints.length} 个途径点`);
        } else {
          alert('未找到有效的途径点数据');
        }
      } catch (error) {
        console.error('文件导入失败:', error);
        alert('文件导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 解析CSV文件
   */
  const parseCSV = (content: string): WaypointData[] => {
    const lines = content.trim().split('\n');
    const waypoints: WaypointData[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length >= 3) {
        const name = parts[0] || `途径点${i + 1}`;
        const lat = parseFloat(parts[1]);
        const lng = parseFloat(parts[2]);
        const desc = parts[3] || '';

        if (!isNaN(lat) && !isNaN(lng)) {
          waypoints.push({
            id: `imported_${Date.now()}_${i}`,
            name,
            lat,
            lng,
            desc,
            type: 'waypoint'
          });
        }
      }
    }

    return waypoints;
  };

  /**
   * 导出途径点
   */
  const handleExportWaypoints = () => {
    if (waypoints.length === 0) {
      alert('没有途径点可以导出');
      return;
    }

    const csvContent = waypoints
      .map(wp => `${wp.name},${wp.lat},${wp.lng},${wp.desc || ''}`)
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `waypoints_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onExportWaypoints?.();
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    color: 'white'
  };

  const successButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#28a745',
    color: 'white'
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: 'white'
  };

  const warningButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#ffc107',
    color: '#212529'
  };

  return (
    <div 
      className={`route-controls ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        ...style
      }}
    >
      {/* 途径点管理 */}
      <div className="waypoint-section">
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
          途径点管理 ({waypoints.length})
        </h4>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            style={primaryButtonStyle}
            onClick={() => setShowWaypointForm(!showWaypointForm)}
            disabled={disabled}
          >
            <Plus size={16} />
            添加途径点
          </button>

          <button
            style={secondaryButtonStyle}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload size={16} />
            导入CSV
          </button>

          <button
            style={secondaryButtonStyle}
            onClick={handleExportWaypoints}
            disabled={disabled || waypoints.length === 0}
          >
            <Download size={16} />
            导出CSV
          </button>

          <button
            style={dangerButtonStyle}
            onClick={onClearWaypoints}
            disabled={disabled || waypoints.length === 0}
          >
            <Trash2 size={16} />
            清除全部
          </button>
        </div>

        {/* 添加途径点表单 */}
        {showWaypointForm && (
          <div 
            style={{
              marginTop: '12px',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: '#f8f9fa'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                placeholder="途径点名称"
                value={newWaypoint.name}
                onChange={(e) => setNewWaypoint(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="描述（可选）"
                value={newWaypoint.desc}
                onChange={(e) => setNewWaypoint(prev => ({ ...prev, desc: e.target.value }))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="number"
                placeholder="纬度"
                step="any"
                value={newWaypoint.lat}
                onChange={(e) => setNewWaypoint(prev => ({ ...prev, lat: e.target.value }))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="number"
                placeholder="经度"
                step="any"
                value={newWaypoint.lng}
                onChange={(e) => setNewWaypoint(prev => ({ ...prev, lng: e.target.value }))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                style={successButtonStyle}
                onClick={handleAddWaypoint}
              >
                确认添加
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() => setShowWaypointForm(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 途径点列表 */}
        {waypoints.length > 0 && (
          <div style={{ marginTop: '8px', maxHeight: '150px', overflowY: 'auto' }}>
            {waypoints.map((waypoint, index) => (
              <div
                key={waypoint.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <div>
                  <span style={{ fontWeight: '500' }}>{index + 1}. {waypoint.name}</span>
                  <span style={{ color: '#6c757d', marginLeft: '8px' }}>
                    ({waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)})
                  </span>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                  onClick={() => onRemoveWaypoint?.(waypoint.id)}
                  disabled={disabled}
                >
                  <Minus size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 路线控制 */}
      <div className="route-section">
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
          路线控制
        </h4>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            style={primaryButtonStyle}
            onClick={onPlanRoute}
            disabled={disabled || waypoints.length < 2}
          >
            <Route size={16} />
            规划路线
          </button>

          <button
            style={dangerButtonStyle}
            onClick={onClearRoute}
            disabled={disabled || !currentRoute}
          >
            <Trash2 size={16} />
            清除路线
          </button>

          <button
            style={secondaryButtonStyle}
            onClick={onFitView}
            disabled={disabled}
          >
            <Target size={16} />
            自适应显示
          </button>
        </div>

        {/* 路线信息 */}
        {currentRoute && (
          <div 
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#e7f3ff',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            <div><strong>距离:</strong> {(currentRoute.distance / 1000).toFixed(2)} km</div>
            <div><strong>预计时间:</strong> {Math.round(currentRoute.duration / 60)} 分钟</div>
            <div><strong>难度:</strong> {
              currentRoute.difficulty === 'easy' ? '简单' :
              currentRoute.difficulty === 'moderate' ? '中等' : '困难'
            }</div>
          </div>
        )}
      </div>

      {/* 导航控制 */}
      <div className="navigation-section">
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
          导航控制
        </h4>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!isNavigating ? (
            <button
              style={successButtonStyle}
              onClick={onStartNavigation}
              disabled={disabled || !currentRoute}
            >
              <Navigation size={16} />
              开始导航
            </button>
          ) : (
            <button
              style={dangerButtonStyle}
              onClick={onStopNavigation}
              disabled={disabled}
            >
              <Square size={16} />
              停止导航
            </button>
          )}

          {!isTracking ? (
            <button
              style={warningButtonStyle}
              onClick={onStartTracking}
              disabled={disabled}
            >
              <Play size={16} />
              开始追踪
            </button>
          ) : (
            <button
              style={dangerButtonStyle}
              onClick={onStopTracking}
              disabled={disabled}
            >
              <Pause size={16} />
              停止追踪
            </button>
          )}

          <button
            style={{
              ...buttonStyle,
              backgroundColor: voiceEnabled ? '#28a745' : '#6c757d',
              color: 'white'
            }}
            onClick={onToggleVoice}
            disabled={disabled}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            语音导航
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
    </div>
  );
};

export default RouteControls;