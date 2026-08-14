import { describe, expect, it } from 'vitest';
import { fitAffine, predictAffine } from './affine';

describe('affine gaze calibration', () => {
  it('recovers a two-dimensional affine mapping', () => {
    const points = [
      { featureX: 0, featureY: 0, screenX: 10, screenY: 20 },
      { featureX: 1, featureY: 0, screenX: 110, screenY: 15 },
      { featureX: 0, featureY: 1, screenX: 30, screenY: 220 },
      { featureX: 1, featureY: 1, screenX: 130, screenY: 215 },
    ];
    const model = fitAffine(points);
    expect(model).not.toBeNull();
    expect(predictAffine(model!, 0.5, 0.5).x).toBeCloseTo(70, 3);
    expect(predictAffine(model!, 0.5, 0.5).y).toBeCloseTo(117.5, 3);
  });

  it('waits for enough calibration points', () => {
    expect(fitAffine([])).toBeNull();
  });
});
