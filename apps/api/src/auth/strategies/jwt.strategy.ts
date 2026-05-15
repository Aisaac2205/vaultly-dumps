import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import jwksRsa from 'jwks-rsa';
import { KeycloakUser } from '../../common/decorators/current-user.decorator';

type SecretCallback = (
  err: Error | null,
  secret?: string | Buffer,
) => void;

interface DecodedHeader {
  kid: string;
  alg: string;
}

interface TokenPayload {
  sub?: unknown;
  email?: unknown;
  preferred_username?: unknown;
  realm_access?: unknown;
  [key: string]: unknown;
}

/**
 * Decode the JWT header (first segment) to extract the `kid`.
 * JWT format: header.payload.signature — each segment is base64url-encoded JSON.
 */
function decodeJwtHeader(token: string): DecodedHeader {
  const [headerSegment] = token.split('.');
  if (!headerSegment) {
    throw new UnauthorizedException('Token malformado');
  }

  // base64url -> base64 -> utf8
  const base64 = headerSegment.replace(/-/g, '+').replace(/_/g, '/');
  const jsonStr = Buffer.from(base64, 'base64').toString('utf8');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const header: unknown = JSON.parse(jsonStr);
  if (
    typeof header !== 'object' ||
    header === null ||
    !('kid' in header) ||
    typeof (header as Record<string, unknown>).kid !== 'string'
  ) {
    throw new UnauthorizedException('Token malformado: falta kid en header');
  }

  return header as DecodedHeader;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const keycloakUrl = configService.get<string>('keycloak.url');
    const keycloakRealm = configService.get<string>('keycloak.realm');
    const jwksUri = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`;

    const jwksClient = jwksRsa({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600_000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    const secretOrKeyProvider = (
      _request: unknown,
      rawJwtToken: string,
      done: SecretCallback,
    ) => {
      let kid: string;
      try {
        kid = decodeJwtHeader(rawJwtToken).kid;
      } catch (err) {
        done(err instanceof Error ? err : new Error('Token malformado'));
        return;
      }

      jwksClient
        .getSigningKey(kid)
        .then((key) => {
          done(null, key.getPublicKey());
        })
        .catch((err: Error) => {
          done(err);
        });
    };

    super({
      secretOrKeyProvider,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(_request: unknown, payload: TokenPayload): KeycloakUser {
    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const preferredUsername =
      typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : undefined;
    const realmAccess =
      typeof payload.realm_access === 'object' &&
      payload.realm_access !== null &&
      'roles' in payload.realm_access &&
      Array.isArray((payload.realm_access as { roles: unknown }).roles)
        ? (payload.realm_access as { roles: string[] })
        : undefined;

    if (!sub || !preferredUsername || !realmAccess) {
      throw new UnauthorizedException(
        'Token inválido: faltan claims requeridos por Keycloak',
      );
    }

    return {
      sub,
      ...(email && { email }),
      preferred_username: preferredUsername,
      realm_access: { roles: realmAccess.roles },
    };
  }
}
