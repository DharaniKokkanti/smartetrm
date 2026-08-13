import { http, HttpResponse } from 'msw';

const API = '/api/v1';

// A fake but valid-shaped JWT. The frontend only inspects the payload of the
// token for display purposes (username/fullName from the LoginResponse body,
// not from the token itself), so this doesn't need to be a real signed JWT —
// it just needs to pass the Axios interceptor's sessionStorage.setItem and
// come back in Authorization headers, which it does.
const MOCK_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYuYWRtaW4iLCJ1c2VySWQiOjEsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock-signature';

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };

    // Both credentials accepted in mock mode: the documented dev seed user
    // AND a blank password (for quick keyboard-enter testing during dev).
    const validUser =
      body.username === 'dev.admin' && (body.password === 'DevPassword123!' || body.password === '');

    if (!validUser) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid username or password.',
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      token: MOCK_TOKEN,
      userId: 1,
      username: 'dev.admin',
      fullName: 'Dev Admin',
      // dev.admin is a mock-only convenience login, not a real seeded
      // app_user with role assignments — treated as the system ADMIN role
      // here so dev-mode behavior matches the real 'admin' dev credential
      // (which really does hold ADMIN) rather than silently hiding the
      // ADMIN-only Static Data override behind mocks.
      isSystemAdmin: true,
      sessionTimeoutSeconds: 120,
    });
  }),

  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 200 })),
];
