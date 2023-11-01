/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {PermissionsAndroid, Text} from 'react-native';
import {Passkey} from 'react-native-passkey';
import {WebView} from 'react-native-webview';

const orchestrationAPIUrl = 'https://simplewebauthn.privateid.com';
const apiKey = '3c9e10d3650c05ab5517';
const origin = 'https://static.privateid.co';

function App(): JSX.Element {
  // 'Tg33NZ0T-ieaF-oxjD-Ygwa-fdyFKYhlRtSR'
  const [uuid, setUuid] = useState('');
  const [predict, setIsPredict] = useState();
  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Cool Photo App Camera Permission',
          message:
            'Cool Photo App needs access to your camera ' +
            'so you can take awesome pictures.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };
  useEffect(() => {
    requestCameraPermission();
  }, []);
  const onNavigationChange = (event: any) => {
    console.log(event, 'navigation');
    const url = event?.url;
    console.log(url, 'url');

    const UUID = url?.split('&uuid=')?.[1];
    setIsPredict(url?.includes('predict'));
    setUuid(UUID);
  };
  const isSupported: boolean = Passkey.isSupported();

  console.log(uuid, 'uuid', isSupported);
  useEffect(() => {
    console.log(60, {predict, uuid});
    if (predict && uuid) {
      authenticatePasskey(uuid);
    } else if (uuid) {
      generatePasskey(uuid);
    }
  }, [uuid, predict]);

  const generatePasskey = async (uuid: string) => {
    const response = await fetch(
      `${orchestrationAPIUrl}/generate-registration-options`,
      {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json',
          x_api_key: apiKey,
          origin: origin,
        },
        body: JSON.stringify({uuid}), // body data type must match "Content-Type" header
      },
    );
    let attResp;
    try {
      const opts = await response.json();
      console.log(opts, 'opts');

      attResp = await Passkey.register(opts);
      console.log(attResp, 'attResp');
    } catch (error: any) {
      console.log(error, 'error', error?.message);

      return;
    }
    const verificationResp = await fetch(
      `${orchestrationAPIUrl}/verify-registration`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          x_api_key: apiKey,
          origin: origin,
        },
        body: JSON.stringify({data: attResp, uuid}),
      },
    );

    const verificationJSON = await verificationResp.json();
    authenticatePasskey(uuid);

    return verificationJSON?.verified;
  };

  const authenticatePasskey = async (uuid: string) => {
    let asseResp;
    console.log('in authenticatePasskey');
    try {
      const response = await fetch(
        `${orchestrationAPIUrl}/generate-authentication-options`,
        {
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
          headers: {
            'Content-Type': 'application/json',
            x_api_key: apiKey,
            origin: origin,
          },
          // credentials: 'include',
          body: JSON.stringify({uuid}), // body data type must match "Content-Type" header
        },
      );
      console.log('after api call');
      let opts;

      try {
        opts = await response.json();
        console.log(
          {...opts},
          'optsresponse',
          response,
          opts.success === false,
        );
        // if (opts.success === false) {
        //   // return generatePasskey(uuid);
        //   return opts;
        // }
        asseResp = await Passkey.authenticate({...opts, allowCredentials: []});
        console.log(asseResp, 'attResp');
      } catch (error: any) {
        console.log('in error block');
        // generatePasskey(uuid);
        console.log(error, 'error');
        return;
      }

      const verificationResp = await fetch(
        `${orchestrationAPIUrl}/verify-authentication`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            x_api_key: apiKey,
            origin: origin,
          },
          // credentials: 'include',
          body: JSON.stringify({
            data: {...asseResp, mainRpID: opts?.allowCredentials?.[0]?.id},
            uuid,
          }),
        },
      );

      const verificationJSON = await verificationResp.json();
      console.log(verificationJSON, 'verificationJSON');

      return verificationJSON?.verified;
    } catch (error) {
      return error;
    }
  };

  return (
    <>
      {uuid ? (
        <Text>{uuid}</Text>
      ) : (
        <WebView
          source={{
            uri: 'https://cvs.devel.privateid.co/wasm-native',
          }}
          style={{marginTop: 20, height: 400, width: 400,}}
          onError={(e: any) => console.log(e, 'e69')}
          onHttpError={e => console.log(e, 'error')}
          javaScriptEnabled
          originWhitelist={['*']}
          onNavigationStateChange={e => onNavigationChange(e)}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          allowsFullscreenVideo={false}
          useWebKit={true}
        />
      )}
    </>
  );
}

export default App;
