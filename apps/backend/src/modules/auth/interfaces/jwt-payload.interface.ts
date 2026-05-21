export interface JwtAccessPayload {
  sub: string;
  email: string;
  orgId: string | null;
  roles: string[];
  permissions: string[];
  mfa: boolean;
}
