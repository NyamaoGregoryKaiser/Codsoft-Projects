import * as dataUtilityService from '../../src/modules/data-utilities/data-utility.service';
import ApiError from '../../src/shared/errors/ApiError';

describe('Data Utility Service', () => {
  describe('oneHotEncode', () => {
    it('should one-hot encode a categorical column correctly', () => {
      const data = [
        { id: 1, color: 'red', value: 10 },
        { id: 2, color: 'blue', value: 20 },
        { id: 3, color: 'red', value: 15 },
        { id: 4, color: 'green', value: 25 },
      ];
      const column = 'color';

      const expected = [
        { id: 1, value: 10, color_red: 1, color_blue: 0, color_green: 0 },
        { id: 2, value: 20, color_red: 0, color_blue: 1, color_green: 0 },
        { id: 3, value: 15, color_red: 1, color_blue: 0, color_green: 0 },
        { id: 4, value: 25, color_red: 0, color_blue: 0, color_green: 1 },
      ];

      const result = dataUtilityService.oneHotEncode(data, column);
      expect(result).toEqual(expect.arrayContaining(expected));
      expect(result.length).toBe(data.length);
    });

    it('should handle empty data array', () => {
      const data: any[] = [];
      const column = 'category';
      expect(dataUtilityService.oneHotEncode(data, column)).toEqual([]);
    });

    it('should handle column not present in some rows gracefully', () => {
      const data = [
        { id: 1, color: 'red' },
        { id: 2, value: 20 }, // 'color' is missing
        { id: 3, color: 'blue' },
      ];
      const column = 'color';
      const expected = [
        { id: 1, color_red: 1, color_blue: 0 },
        { id: 2, color_red: 0, color_blue: 0 }, // Should just create the new columns with 0
        { id: 3, color_red: 0, color_blue: 1 },
      ];
      const result = dataUtilityService.oneHotEncode(data, column);
      expect(result).toEqual(expect.arrayContaining([
        { id: 1, color_red: 1, color_blue: 0 },
        { id: 2, color_red: 0, color_blue: 0, value: 20 }, // value should be preserved
        { id: 3, color_red: 0, color_blue: 1 },
      ]));
    });

    it('should handle numeric values in a categorical column', () => {
      const data = [{ col: 1 }, { col: 2 }, { col: 1 }];
      const column = 'col';
      const expected = [
        { col_1: 1, col_2: 0 },
        { col_1: 0, col_2: 1 },
        { col_1: 1, col_2: 0 },
      ];
      const result = dataUtilityService.oneHotEncode(data, column);
      expect(result).toEqual(expect.arrayContaining(expected));
    });
  });

  describe('minMaxScale', () => {
    it('should min-max scale a numerical column correctly', () => {
      const data = [
        { id: 1, feature: 10, category: 'A' },
        { id: 2, feature: 20, category: 'B' },
        { id: 3, feature: 15, category: 'A' },
        { id: 4, feature: 5, category: 'C' },
      ];
      const column = 'feature';

      // min = 5, max = 20
      // 10 -> (10-5)/(20-5) = 5/15 = 0.333
      // 20 -> (20-5)/(20-5) = 15/15 = 1
      // 15 -> (15-5)/(20-5) = 10/15 = 0.666
      // 5  -> (5-5)/(20-5) = 0/15 = 0
      const expected = [
        { id: 1, category: 'A', feature_scaled: 0.3333333333333333 },
        { id: 2, category: 'B', feature_scaled: 1 },
        { id: 3, category: 'A', feature_scaled: 0.6666666666666666 },
        { id: 4, category: 'C', feature_scaled: 0 },
      ];

      const result = dataUtilityService.minMaxScale(data, column);
      expect(result).toEqual(expect.arrayContaining(expected));
      expect(result.length).toBe(data.length);
      // Check values with tolerance for floating point
      expect(result[0].feature_scaled).toBeCloseTo(1 / 3);
      expect(result[1].feature_scaled).toBeCloseTo(1);
      expect(result[2].feature_scaled).toBeCloseTo(2 / 3);
      expect(result[3].feature_scaled).toBeCloseTo(0);
    });

    it('should handle empty data array', () => {
      const data: any[] = [];
      const column = 'value';
      expect(dataUtilityService.minMaxScale(data, column)).toEqual([]);
    });

    it('should throw an error if column has no numeric values', async () => {
      const data = [{ item: 'A' }, { item: 'B' }];
      const column = 'value';
      await expect(() => dataUtilityService.minMaxScale(data, column)).toThrow(
        new ApiError(400, "Column 'value' contains no numeric values for scaling.")
      );
    });

    it('should handle column not present in some rows', () => {
      const data = [
        { id: 1, value: 10 },
        { id: 2, other: 'text' }, // 'value' is missing
        { id: 3, value: 20 },
      ];
      const column = 'value';

      const result = dataUtilityService.minMaxScale(data, column);
      expect(result).toEqual(expect.arrayContaining([
        { id: 1, value_scaled: 0 },
        { id: 2, other: 'text', value_scaled: 'text' }, // non-numeric treated as is
        { id: 3, value_scaled: 1 },
      ]));
    });

    it('should return 0 for all scaled values if min equals max', () => {
      const data = [
        { id: 1, value: 10 },
        { id: 2, value: 10 },
        { id: 3, value: 10 },
      ];
      const column = 'value';
      const expected = [
        { id: 1, value_scaled: 0 },
        { id: 2, value_scaled: 0 },
        { id: 3, value_scaled: 0 },
      ];
      const result = dataUtilityService.minMaxScale(data, column);
      expect(result).toEqual(expect.arrayContaining(expected));
    });
  });
});