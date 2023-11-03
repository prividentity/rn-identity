const webAuthnAPIUrl = 'https://simplewebauthn.privateid.com';
const origin = 'https://static.privateid.co';

export const generateRegistrationOptions = async (uuid: string) => {
  try {
    const response = await fetch(
      `${webAuthnAPIUrl}/generate-registration-options`,
      {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json',
          origin: origin,
        },
        body: JSON.stringify({uuid}), // body data type must match "Content-Type" header
      },
    );
    const opts = await response.json();
    return opts;
  } catch (error) {}
};

export const verifyRegistration = async (attResp: any, uuid: string) => {
  try {
    const verificationResp = await fetch(
      `${webAuthnAPIUrl}/verify-registration`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: origin,
        },
        body: JSON.stringify({data: attResp, uuid}),
      },
    );

    const verificationJSON = await verificationResp.json();
    return verificationJSON;
  } catch (error) {}
};

export const generateAuthenticationOptions = async (uuid: string) => {
  try {
    const response = await fetch(
      `${webAuthnAPIUrl}/generate-authentication-options`,
      {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json',
          origin: origin,
        },
        body: JSON.stringify({uuid}), // body data type must match "Content-Type" header
      },
    );
    const opts = await response.json();
    return opts;
  } catch (error) {}
};

export const verifyAuthentication = async (
  asseResp: any,
  opts: any,
  uuid: string,
) => {
  try {
    const verificationResp = await fetch(
      `${webAuthnAPIUrl}/verify-authentication`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: origin,
        },
        body: JSON.stringify({
          data: {...asseResp, mainRpID: opts?.allowCredentials?.[0]?.id},
          uuid,
        }),
      },
    );

    const verificationJSON = await verificationResp.json();
    return verificationJSON;
  } catch (error) {}
};
