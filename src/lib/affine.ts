export interface CalibrationPair {
  featureX: number;
  featureY: number;
  screenX: number;
  screenY: number;
}

export interface AffineModel {
  x: [number, number, number];
  y: [number, number, number];
}

export function fitAffine(samples: CalibrationPair[]): AffineModel | null {
  if (samples.length < 3) return null;
  const normal = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const bx = [0, 0, 0];
  const by = [0, 0, 0];
  for (const sample of samples) {
    const row = [1, sample.featureX, sample.featureY];
    for (let i = 0; i < 3; i += 1) {
      bx[i] += row[i] * sample.screenX;
      by[i] += row[i] * sample.screenY;
      for (let j = 0; j < 3; j += 1) normal[i][j] += row[i] * row[j];
    }
  }
  normal[1][1] += 1e-6;
  normal[2][2] += 1e-6;
  const x = solve3(normal, bx);
  const y = solve3(normal, by);
  return x && y ? { x, y } : null;
}

export function predictAffine(model: AffineModel, featureX: number, featureY: number) {
  return {
    x: model.x[0] + model.x[1] * featureX + model.x[2] * featureY,
    y: model.y[0] + model.y[1] * featureX + model.y[2] * featureY,
  };
}

function solve3(matrix: number[][], vector: number[]): [number, number, number] | null {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < 3; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    if (Math.abs(augmented[column][column]) < 1e-9) return null;
    const divisor = augmented[column][column];
    for (let index = column; index < 4; index += 1) augmented[column][index] /= divisor;
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index < 4; index += 1) augmented[row][index] -= factor * augmented[column][index];
    }
  }
  return [augmented[0][3], augmented[1][3], augmented[2][3]];
}
