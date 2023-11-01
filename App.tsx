/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Passkey} from 'react-native-passkey';
import {WebView} from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from './services';
import {getQueryParams} from './utils';

function App(): JSX.Element {
  const [uuid, setUuid] = useState('');
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [predictWithPasskey, setPredictWithPasskey] = useState(false);

  const setInitialState = () => {
    setUuid('');
    setLoader(false);
    setError('');
    setMessage('');
    setSuccess(false);
    setPredictWithPasskey(false);
    if (Platform.OS === 'android') {
      requestCameraPermission();
    }
  };
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
    if (Platform.OS === 'android') {
      requestCameraPermission();
    }
  }, []);
  const onNavigationChange = (event: any) => {
    const url = event?.url;
    const queryParams = getQueryParams(url);
    const UUID = queryParams.uuid;
    const predictUser = queryParams.predict === 'true';
    if (predictUser) {
      const withPassKey = queryParams.withPassKey === 'true';
      if (withPassKey) {
        setPredictWithPasskey(true);
      } else {
        setMessage('Authentication Successful');
        setSuccess(true);
      }
    }
    setUuid(UUID);
  };
  const isSupported: boolean = Passkey.isSupported();

  useEffect(() => {
    if (isSupported) {
      if (predictWithPasskey && uuid) {
        authenticatePasskey(uuid);
      } else if (uuid && !success) {
        generatePasskey(uuid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid, predictWithPasskey, isSupported]);

  const generatePasskey = async (userUUID: string) => {
    let attResp;
    try {
      const opts = await generateRegistrationOptions(userUUID);
      console.log(opts, 'opts');
      setMessage('Generating passkey......');
      setLoader(true);
      attResp = await Passkey.register(opts);
      setLoader(false);
      console.log(attResp, 'attResp');
      const verificationJSON = await verifyRegistration(attResp, userUUID);
      if (verificationJSON?.verified) {
        setMessage('Passkey successfully generated.');
        setSuccess(true);
      }

      return verificationJSON?.verified;
    } catch (err: any) {
      console.log(err, 'Generating error', err?.message);
      setLoader(false);
      if (
        err?.message.includes(
          'androidx.credentials.exceptions.domerrors.InvalidStateError@',
        )
      ) {
        setError('Passkey already exists');
      } else {
        setError(err?.message);
      }

      return false;
    }
  };

  const authenticatePasskey = async (userUUID: string) => {
    let asseResp;

    try {
      let opts;
      try {
        opts = await generateAuthenticationOptions(userUUID);
        console.log(opts, 'Authenticating ots');
        if (opts.success === false) {
          // return generatePasskey(uuid);
          setError(opts?.message);
          return opts;
        }
        setMessage('Authenticating passkey......');
        setLoader(true);
        asseResp = await Passkey.authenticate({...opts, allowCredentials: []});
        setLoader(false);
        console.log(asseResp, 'Authenticating attResp');
        // eslint-disable-next-line no-catch-shadow
      } catch (err: any) {
        console.log(err, 'Authenticating error');
        setError(err?.message);
        setLoader(false);
        return;
      }

      const verificationJSON = await verifyAuthentication(
        asseResp,
        opts,
        userUUID,
      );
      console.log(verificationJSON, 'verificationJSON');
      if (verificationJSON?.verified) {
        setMessage('Passkey successfully authenticated.');
        setSuccess(true);
      } else if (verificationJSON?.error) {
        setError(verificationJSON?.error);
      }

      return verificationJSON?.verified;
    } catch (err) {
      console.log(158, {err});
      return err;
    }
  };

  const Error = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <MaterialIcons name="dangerous" size={70} color="red" />
      <Text
        style={{
          textAlign: 'center',
          fontSize: 25,
          color: 'red',
        }}>
        {error}
      </Text>
    </View>
  );

  const Success = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <AntDesign name="checkcircleo" size={70} color="green" />
      <Text
        style={{
          textAlign: 'center',
          fontSize: 25,
          color: 'green',
        }}>
        {message}
      </Text>
    </View>
  );

  const Loading = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 25,
        }}>
        {message}
      </Text>
      <ActivityIndicator size="large" />
    </View>
  );

  const RenderState = () => {
    if (success) {
      return <Success />;
    }
    if (loader) {
      return <Loading />;
    }
    if (error) {
      return <Error />;
    }
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  if (uuid) {
    return (
      <SafeAreaView style={{flex: 1}}>
        <RenderState />
        <TouchableOpacity
          style={{flex: 0.2, alignItems: 'center'}}
          onPress={setInitialState}>
          <Text style={{textDecorationLine: 'underline', fontSize: 18}}>
            Back to Main Page
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{height: '100%'}}>
      <WebView
        source={{
          uri: 'https://charlie.devel.privateid.co/wasm-native',
        }}
        style={{marginTop: 20, height: 400}}
        onError={(e: any) => console.log(e, 'e69')}
        onHttpError={e => console.log(e, 'error')}
        // javaScriptEnabled
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        onNavigationStateChange={e => onNavigationChange(e)}
        mediaPlaybackRequiresUserAction={false}
        webviewDebuggingEnabled={true}
      />
    </SafeAreaView>
  );
}

export default App;
