import {
  createDetector,
  DetectionChain,
  DetectionStrategy,
  DevToolsStrategy,
  FiberStrategy,
  HeuristicStrategy,
  FallbackStrategy,
} from '../index';

describe('index exports', () => {
  it('createDetector() returns a DetectionChain instance', () => {
    const detector = createDetector();
    expect(detector).toBeInstanceOf(DetectionChain);
  });

  it('all expected exports exist', () => {
    expect(DetectionStrategy).toBeDefined();
    expect(DetectionChain).toBeDefined();
    expect(DevToolsStrategy).toBeDefined();
    expect(FiberStrategy).toBeDefined();
    expect(HeuristicStrategy).toBeDefined();
    expect(FallbackStrategy).toBeDefined();
    expect(typeof createDetector).toBe('function');
  });

  it('createDetector().detectComponent(div) returns a result via fallback', () => {
    const detector = createDetector();
    const div = document.createElement('div');
    document.body.appendChild(div);

    const result = detector.detectComponent(div);
    // The fallback strategy always returns a non-null result
    expect(result).not.toBeNull();
    expect(result!.name).toBeTruthy();
    expect(result!.element).toBe(div);

    document.body.removeChild(div);
  });
});
