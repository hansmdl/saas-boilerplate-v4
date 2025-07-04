import { createOrganizationSchema } from '../../src/organization/dto/create-organization.dto';

describe('CreateOrganizationDto', () => {
  it('should validate correct input', () => {
    const validInput = { name: 'Valid Org' };
    const result = createOrganizationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should invalidate empty name', () => {
    const invalidInput = { name: '' };
    const result = createOrganizationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Organization name is required');
    }
  });

  it('should invalidate missing name', () => {
    const invalidInput = {};
    const result = createOrganizationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
