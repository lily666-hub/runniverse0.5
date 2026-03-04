import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationResult {
  private errors: ValidationError[] = [];

  addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }
}

// 验证经纬度
export function validateCoordinates(lng: number, lat: number): ValidationResult {
  const result = new ValidationResult();

  if (typeof lng !== 'number' || isNaN(lng)) {
    result.addError('lng', '经度必须是有效数字');
  } else if (lng < -180 || lng > 180) {
    result.addError('lng', '经度必须在-180到180之间');
  }

  if (typeof lat !== 'number' || isNaN(lat)) {
    result.addError('lat', '纬度必须是有效数字');
  } else if (lat < -90 || lat > 90) {
    result.addError('lat', '纬度必须在-90到90之间');
  }

  return result;
}

// 验证用户ID
export function validateUserId(userId: string): ValidationResult {
  const result = new ValidationResult();

  if (!userId || typeof userId !== 'string') {
    result.addError('userId', '用户ID不能为空');
  } else if (userId.length < 1 || userId.length > 50) {
    result.addError('userId', '用户ID长度必须在1-50字符之间');
  }

  return result;
}

// 验证时间戳
export function validateTimestamp(timestamp: string): ValidationResult {
  const result = new ValidationResult();

  if (!timestamp) {
    result.addError('timestamp', '时间戳不能为空');
  } else {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      result.addError('timestamp', '时间戳格式无效');
    }
  }

  return result;
}

// 验证紧急类型
export function validateEmergencyType(type: string): ValidationResult {
  const result = new ValidationResult();
  const validTypes = ['sos', 'medical', 'accident', 'harassment', 'suspicious'];

  if (!type) {
    result.addError('type', '紧急类型不能为空');
  } else if (!validTypes.includes(type)) {
    result.addError('type', `紧急类型必须是以下之一: ${validTypes.join(', ')}`);
  }

  return result;
}

// 验证严重程度
export function validateSeverity(severity: string): ValidationResult {
  const result = new ValidationResult();
  const validSeverities = ['low', 'medium', 'high', 'critical'];

  if (!severity) {
    result.addError('severity', '严重程度不能为空');
  } else if (!validSeverities.includes(severity)) {
    result.addError('severity', `严重程度必须是以下之一: ${validSeverities.join(', ')}`);
  }

  return result;
}

// 验证安全评估请求
export function validateSafetyAssessmentRequest(req: Request, res: Response, next: NextFunction): void {
  const { lng, lat, timestamp } = req.body;
  const allErrors: ValidationError[] = [];

  // 验证坐标
  const coordResult = validateCoordinates(lng, lat);
  allErrors.push(...coordResult.getErrors());

  // 验证时间戳
  if (timestamp) {
    const timestampResult = validateTimestamp(timestamp);
    allErrors.push(...timestampResult.getErrors());
  }

  if (allErrors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: allErrors
    });
    return;
  }

  next();
}

// 验证紧急报告请求
export function validateEmergencyReportRequest(req: Request, res: Response, next: NextFunction): void {
  const { type, lng, lat, severity, userId, timestamp } = req.body;
  const allErrors: ValidationError[] = [];

  // 验证用户ID
  const userIdResult = validateUserId(userId);
  allErrors.push(...userIdResult.getErrors());

  // 验证紧急类型
  const typeResult = validateEmergencyType(type);
  allErrors.push(...typeResult.getErrors());

  // 验证坐标
  const coordResult = validateCoordinates(lng, lat);
  allErrors.push(...coordResult.getErrors());

  // 验证严重程度
  const severityResult = validateSeverity(severity);
  allErrors.push(...severityResult.getErrors());

  // 验证时间戳
  const timestampResult = validateTimestamp(timestamp);
  allErrors.push(...timestampResult.getErrors());

  if (allErrors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: allErrors
    });
    return;
  }

  next();
}

// 验证位置更新请求
export function validateLocationUpdateRequest(req: Request, res: Response, next: NextFunction): void {
  const { userId, lng, lat, timestamp } = req.body;
  const allErrors: ValidationError[] = [];

  // 验证用户ID
  const userIdResult = validateUserId(userId);
  allErrors.push(...userIdResult.getErrors());

  // 验证坐标
  const coordResult = validateCoordinates(lng, lat);
  allErrors.push(...coordResult.getErrors());

  // 验证时间戳
  const timestampResult = validateTimestamp(timestamp);
  allErrors.push(...timestampResult.getErrors());

  if (allErrors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: allErrors
    });
    return;
  }

  next();
}

// 验证路线安全分析请求
export function validateRouteSafetyRequest(req: Request, res: Response, next: NextFunction): void {
  const { startLng, startLat, endLng, endLat } = req.body;
  const allErrors: ValidationError[] = [];

  // 验证起点坐标
  const startCoordResult = validateCoordinates(startLng, startLat);
  startCoordResult.getErrors().forEach(error => {
    allErrors.push({
      field: `start${error.field.charAt(0).toUpperCase() + error.field.slice(1)}`,
      message: `起点${error.message}`
    });
  });

  // 验证终点坐标
  const endCoordResult = validateCoordinates(endLng, endLat);
  endCoordResult.getErrors().forEach(error => {
    allErrors.push({
      field: `end${error.field.charAt(0).toUpperCase() + error.field.slice(1)}`,
      message: `终点${error.message}`
    });
  });

  if (allErrors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: allErrors
    });
    return;
  }

  next();
}

// 验证用户偏好更新请求
export function validateUserPreferencesRequest(req: Request, res: Response, next: NextFunction): void {
  const { userId, preferences } = req.body;
  const allErrors: ValidationError[] = [];

  // 验证用户ID
  const userIdResult = validateUserId(userId);
  allErrors.push(...userIdResult.getErrors());

  // 验证偏好设置
  if (!preferences || typeof preferences !== 'object') {
    allErrors.push({
      field: 'preferences',
      message: '偏好设置必须是有效的对象'
    });
  }

  if (allErrors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: allErrors
    });
    return;
  }

  next();
}

// 通用参数验证中间件
export function validateParams(validations: { [key: string]: (value: any) => ValidationResult }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const allErrors: ValidationError[] = [];

    for (const [param, validator] of Object.entries(validations)) {
      const value = req.body[param] || req.params[param] || req.query[param];
      const result = validator(value);
      allErrors.push(...result.getErrors());
    }

    if (allErrors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        details: allErrors
      });
      return;
    }

    next();
  };
}