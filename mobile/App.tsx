import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';

import {
  CarDetailResponse,
  CarSummary,
  createCar,
  deleteCar,
  fetchCarDetail,
  fetchCars,
  fetchNotifications,
  fetchRegistration,
  fetchViolations,
  login,
  NotificationEvent,
  Registration,
  Session,
  signup,
  updateCar,
  updateProfile,
  Violation,
} from './src/api';
import { DEMO_CARS, DEMO_DETAILS, DEMO_NOTIFICATIONS, DEMO_SESSION } from './src/demo';

const GREEN = '#8DFF16';
const GREEN_DARK = '#58C900';
const INK = '#121713';
const MUTED = '#70786F';
const BG = '#F5F7F4';
const CARD = '#FFFFFF';
const SOFT = '#EEF1ED';
const BORDER = '#E4E8E2';
const RED = '#FF4D4F';
const RED_SOFT = '#FFF0F0';
const AMBER = '#F4A915';
const AMBER_SOFT = '#FFF7DF';
const BLUE = '#3B82F6';

// Dark signed-in product theme — inspired by the automotive dashboard reference.
const APP_BG = '#07111B';
const APP_CARD = '#0E1924';
const APP_CARD_ALT = '#142230';
const APP_BORDER = '#263849';
const APP_TEXT = '#F4F7FB';
const APP_MUTED = '#91A0AF';
const APP_BLUE = '#5AA7FF';
const APP_BLUE_SOFT = '#132B42';
const APP_GREEN = '#43D984';
const APP_GREEN_SOFT = '#11291F';
const APP_RED = '#FF5D68';
const APP_RED_SOFT = '#2B161C';
const CITYPAY_URL = 'https://a836-citypay.nyc.gov/citypay/Parking';
const SESSION_KEY = 'tixradar:session';
const INTRO_KEY = 'tixradar:intro-v2';
const RECENT_LOOKUPS_KEY = 'tixradar:recent-lookups';
const NOTIFICATION_PREFS_KEY = 'tixradar:notification-prefs';
const AVATAR_KEY_PREFIX = 'tixradar:avatar:';
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const STATE_NAMES: Record<string, string> = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', DC:'District of Columbia', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming' };

const ICON = require('./assets/tixradar-icon.png');
const WORDMARK_DARK = require('./assets/tixradar-wordmark-dark.png');
const WORDMARK_LIGHT = require('./assets/tixradar-wordmark-light.png');
const BRAND_BLACK = require('./assets/tixradar-logo-black.png');
const HOME_HERO = require('./assets/home-hero.png');
const CAR_WHITE = require('./assets/car-white.png');
const CAR_DARK = require('./assets/car-dark.png');

const CAR_SEDAN = require('./assets/car-sedan-user.png');
const CAR_SUV = require('./assets/car-suv-user.png');
const CAR_JEEP = require('./assets/car-jeep-user.png');
const OFFER_CARWASH = require('./assets/offer-carwash.png');
const OFFER_FUELSTOP = require('./assets/offer-fuelstop.png');

const ICON_HOME = require('./assets/icon-home.png');
const ICON_VEHICLES = require('./assets/icon-vehicles.png');
const ICON_FINES = require('./assets/icon-fines.png');
const ICON_MORE = require('./assets/icon-more.png');
const ICON_NOTIFICATION = require('./assets/icon-notification.png');
const ICON_SEARCH = require('./assets/icon-search.png');
const ICON_VIN = require('./assets/icon-vin.png');
const ICON_OUTSTANDING = require('./assets/icon-outstanding.png');
const ICON_WARNING = require('./assets/icon-warning.png');
const ICON_ARROW = require('./assets/icon-arrow.png');
const ICON_PLATE_DETAIL = require('./assets/icon-plate-detail.png');
const ICON_REGISTRATION_DETAIL = require('./assets/icon-registration-detail.png');
const ICON_COPY_DETAIL = require('./assets/icon-copy-detail.png');
const ICON_PROFILE_DETAIL = require('./assets/icon-profile-detail.png');
const ICON_WEEKLY_DETAIL = require('./assets/icon-weekly-detail.png');
const ICON_MONEY_DETAIL = require('./assets/icon-money-detail.png');

type VehicleIconKey = 'group' | 'hatchback' | 'pickup' | 'sedan' | 'supercar' | 'suv';

const VEHICLE_ICON_ASSETS: Record<VehicleIconKey, number> = {
  group: require('./assets/car-group-d5.png'),
  hatchback: require('./assets/car-hatchback-d5.png'),
  pickup: require('./assets/car-pickup-d5.png'),
  sedan: require('./assets/car-sedan-d5.png'),
  supercar: require('./assets/car-supercar-d5.png'),
  suv: require('./assets/car-suv-d5.png'),
};
const VEHICLE_ICON_OPTIONS: Array<{ key: VehicleIconKey; label: string }> = [
  { key: 'group', label: 'Wagon' },
  { key: 'hatchback', label: 'Hatchback' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'sedan', label: 'Sedan' },
  { key: 'supercar', label: 'Sports car' },
  { key: 'suv', label: 'SUV' },
];
const AVATAR_ASSETS = [
  require('./assets/avatar-01.png'), require('./assets/avatar-02.png'), require('./assets/avatar-03.png'),
  require('./assets/avatar-04.png'), require('./assets/avatar-05.png'), require('./assets/avatar-06.png'),
  require('./assets/avatar-07.png'), require('./assets/avatar-08.png'), require('./assets/avatar-09.png'),
  require('./assets/avatar-10.png'), require('./assets/avatar-11.png'), require('./assets/avatar-12.png'),
  require('./assets/avatar-13.png'),
];

type MainTab = 'home' | 'vehicles' | 'fines' | 'more';
type LookupMode = 'plate' | 'vin';
type Route =
  | { name: 'main'; tab: MainTab }
  | { name: 'lookup'; mode: LookupMode }
  | { name: 'lookupResults'; plate: string; state: string; violations: Violation[] }
  | { name: 'registrationResults'; vin: string; registrations: Registration[] }
  | { name: 'carDetail'; carId: number }
  | { name: 'violationDetail'; violation: Violation; carName?: string }
  | { name: 'payment'; violation: Violation }
  | { name: 'addVehicle' }
  | { name: 'editVehicle'; carId: number }
  | { name: 'notifications' }
  | { name: 'settings' }
  | { name: 'profileEdit' }
  | { name: 'offer'; offerId: OfferId }
  | { name: 'vehicleAdded'; car: CarSummary };

type AuthMode = 'signin' | 'signup';
type SocialProvider = 'google' | 'apple';
type OfferId = 'carwash' | 'fuelstop';

type Offer = {
  id: OfferId;
  image: number;
  title: string;
  short: string;
  partner: string;
  code: string;
  terms: string;
};

const OFFERS: Offer[] = [
  {
    id: 'carwash',
    image: OFFER_CARWASH,
    title: '20% off an exterior car wash',
    short: 'Keep your car clean for less with a Tixradar partner offer.',
    partner: 'Participating car-wash locations',
    code: 'TIXWASH20',
    terms: 'Valid on one standard exterior wash. Partner availability and final redemption terms can be connected before launch.',
  },
  {
    id: 'fuelstop',
    image: OFFER_FUELSTOP,
    title: '20% off a fuel-stop treat',
    short: 'A small perk for the road, available from participating partners.',
    partner: 'Participating fuel-stop locations',
    code: 'TIXSTOP20',
    terms: 'Valid on one eligible partner item. Final participating locations and redemption rules can be connected before launch.',
  },
];

export default function App() {
  const [booting, setBooting] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [session, setSession] = useState<Session | null>(null);
  const [profileSetupPending, setProfileSetupPending] = useState(false);
  const [route, setCurrentRoute] = useState<Route>({ name: 'main', tab: 'home' });
  const [history, setHistory] = useState<Route[]>([]);
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [details, setDetails] = useState<Record<number, CarDetailResponse>>({});
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const demoInitialized = useRef(false);

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    if (session) void refreshData();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void AsyncStorage.getItem(`${AVATAR_KEY_PREFIX}${session.user.id}`).then((value) => {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed < AVATAR_ASSETS.length) setAvatarIndex(parsed);
      else setAvatarIndex(0);
    });
  }, [session]);

  async function hydrate() {
    try {
      const [savedIntro, savedSession] = await Promise.all([
        AsyncStorage.getItem(INTRO_KEY),
        AsyncStorage.getItem(SESSION_KEY),
      ]);
      setIntroComplete(savedIntro === '1');
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as Session;
        setSession(parsed);
        setProfileSetupPending(!parsed.user.full_name?.trim());
      }
    } catch {
      // A corrupt local cache should never prevent the app from opening.
    } finally {
      setBooting(false);
    }
  }

  const refreshData = useCallback(async () => {
    if (!session) return;
    setLoadingData(true);
    try {
      if (session.demo) {
        if (!demoInitialized.current) {
          setCars(DEMO_CARS.map((c) => ({ ...c })));
          setDetails({ ...DEMO_DETAILS });
          setNotifications(DEMO_NOTIFICATIONS.map((item) => ({ ...item })));
          demoInitialized.current = true;
        }
        return;
      }

      const result = await fetchCars(session.token);
      setCars(result.cars);
      const detailPairs = await Promise.all(
        result.cars.map(async (car) => {
          try {
            return [car.id, await fetchCarDetail(car.id, session.token)] as const;
          } catch {
            return [car.id, null] as const;
          }
        }),
      );
      const nextDetails: Record<number, CarDetailResponse> = {};
      detailPairs.forEach(([id, detail]) => {
        if (detail) nextDetails[id] = detail;
      });
      setDetails(nextDetails);
      try {
        const feed = await fetchNotifications(session.token);
        setNotifications(feed.notifications);
      } catch {
        setNotifications([]);
      }
    } catch (err) {
      Alert.alert('Couldn’t refresh', getErrorMessage(err));
    } finally {
      setLoadingData(false);
    }
  }, [session]);

  async function finishIntro(mode: 'continue' | AuthMode) {
    await AsyncStorage.setItem(INTRO_KEY, '1');
    setIntroComplete(true);
    if (mode === 'continue') return;
    if (session) {
      demoInitialized.current = false;
      await AsyncStorage.removeItem(SESSION_KEY);
      setSession(null);
      setCars([]);
      setDetails({});
      setNotifications([]);
      setProfileSetupPending(false);
    }
    setAuthMode(mode);
  }

  async function returnToIntro() {
    await AsyncStorage.removeItem(INTRO_KEY);
    setIntroComplete(false);
  }

  async function saveSession(next: Session, requireProfileSetup = false) {
    demoInitialized.current = false;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    setProfileSetupPending(requireProfileSetup || !next.user.full_name?.trim());
    setHistory([]);
    setCurrentRoute({ name: 'main', tab: 'home' });
  }

  async function completeInitialProfile(nickname: string, selectedAvatar: number) {
    if (!session) return;
    const clean = nickname.trim();
    if (!clean) throw new Error('Choose a nickname.');
    if (clean.length > 40) throw new Error('Keep your nickname under 40 characters.');
    const user = session.demo
      ? { ...session.user, full_name: clean }
      : (await updateProfile(session.token, clean)).user;
    const nextSession: Session = { ...session, user };
    await Promise.all([
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)),
      AsyncStorage.setItem(`${AVATAR_KEY_PREFIX}${nextSession.user.id}`, String(selectedAvatar)),
    ]);
    setSession(nextSession);
    setAvatarIndex(selectedAvatar);
    setProfileSetupPending(false);
    setHistory([]);
    setCurrentRoute({ name: 'main', tab: 'home' });
  }

  async function signOut() {
    demoInitialized.current = false;
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
    setCars([]);
    setDetails({});
    setNotifications([]);
    setHistory([]);
    setCurrentRoute({ name: 'main', tab: 'home' });
    setAuthMode('signin');
    setProfileSetupPending(false);
  }

  function navigate(next: Route) {
    setHistory((current) => [...current, route]);
    setCurrentRoute(next);
  }

  function replaceRoute(next: Route) {
    setCurrentRoute(next);
  }

  function goBack(fallback: Route = { name: 'main', tab: 'home' }) {
    const previous = history[history.length - 1];
    if (previous) {
      setHistory((current) => current.slice(0, -1));
      setCurrentRoute(previous);
    } else {
      setCurrentRoute(fallback);
    }
  }

  function openMain(_tab: MainTab = 'home') {
    // Tixradar now has one primary destination: Home. Supporting flows open on top of it.
    setHistory([]);
    setCurrentRoute({ name: 'main', tab: 'home' });
  }

  async function removeVehicle(carId: number) {
    if (!session) return;
    if (session.demo) {
      setCars((current) => current.filter((car) => car.id !== carId));
      setDetails((current) => {
        const next = { ...current };
        delete next[carId];
        return next;
      });
      setNotifications((current) => current.filter((item) => item.car_id !== carId));
      return;
    }
    await deleteCar(carId, session.token);
    await refreshData();
  }

  async function saveVehicleChanges(
    carId: number,
    input: { nickname: string; plate: string; state: string; vin?: string; vehicle_icon?: string },
  ): Promise<CarSummary> {
    if (!session) throw new Error('Sign in again to update this vehicle.');
    if (session.demo) {
      const current = cars.find((car) => car.id === carId);
      if (!current) throw new Error('Vehicle not found.');
      const updated: CarSummary = {
        ...current,
        nickname: input.nickname,
        plate: input.plate.toUpperCase(),
        state: input.state.toUpperCase(),
        vin: input.vin?.trim() || null,
        has_registration: Boolean(input.vin?.trim()),
        vehicle_icon: input.vehicle_icon || current.vehicle_icon || 'sedan',
      };
      setCars((list) => list.map((car) => car.id === carId ? updated : car));
      setDetails((currentDetails) => {
        const existing = currentDetails[carId];
        if (!existing) return currentDetails;
        return {
          ...currentDetails,
          [carId]: {
            ...existing,
            car: updated,
            registration: input.vin?.trim() ? existing.registration : null,
          },
        };
      });
      return updated;
    }
    const result = await updateCar(carId, session.token, input);
    await refreshData();
    return result.car;
  }

  async function changeAvatar(index: number) {
    if (!session || index < 0 || index >= AVATAR_ASSETS.length) return;
    setAvatarIndex(index);
    await AsyncStorage.setItem(`${AVATAR_KEY_PREFIX}${session.user.id}`, String(index));
  }

  async function saveProfileName(fullName: string) {
    if (!session) throw new Error('Sign in again to update your profile.');
    const clean = fullName.trim();
    if (!clean) throw new Error('Enter a nickname.');
    if (clean.length > 40) throw new Error('Keep your nickname under 40 characters.');

    const user = session.demo
      ? { ...session.user, full_name: clean }
      : (await updateProfile(session.token, clean)).user;
    const nextSession: Session = { ...session, user };
    setSession(nextSession);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }

  if (booting) return <LaunchScreen />;
  if (!introComplete) {
    return (
      <WelcomeScreen
        session={session}
        onContinue={() => void finishIntro('continue')}
        onCreateAccount={() => void finishIntro('signup')}
        onSignIn={() => void finishIntro('signin')}
      />
    );
  }
  if (!session) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onSession={(next, isNewAccount) => void saveSession(next, isNewAccount)}
        onBack={() => void returnToIntro()}
      />
    );
  }
  if (profileSetupPending) {
    return (
      <ProfileSetupScreen
        session={session}
        initialAvatar={avatarIndex}
        onComplete={completeInitialProfile}
        onSignOut={() => void signOut()}
      />
    );
  }

  const common = {
    session,
    cars,
    details,
    notifications,
    route,
    setRoute: navigate,
    goBack,
    openMain,
    refreshData,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {route.name === 'main' && route.tab === 'home' && (
        <HomeScreen {...common} avatarSource={AVATAR_ASSETS[avatarIndex]} refreshing={refreshing} setRefreshing={setRefreshing} loadingData={loadingData} />
      )}
      {route.name === 'lookup' && <LookupScreen mode={route.mode} setRoute={navigate} goBack={goBack} />}
      {route.name === 'lookupResults' && <LookupResultsScreen route={route} setRoute={navigate} goBack={goBack} />}
      {route.name === 'registrationResults' && <RegistrationResultsScreen route={route} goBack={goBack} />}
      {route.name === 'carDetail' && (
        <CarDetailScreen
          carId={route.carId}
          details={details}
          setRoute={navigate}
          goBack={goBack}
          openMain={openMain}
          onDelete={removeVehicle}
        />
      )}
      {route.name === 'violationDetail' && <ViolationDetailScreen route={route} setRoute={navigate} goBack={goBack} />}
      {route.name === 'payment' && <PaymentScreen violation={route.violation} goBack={goBack} />}
      {route.name === 'addVehicle' && (
        <AddVehicleScreen
          session={session}
          goBack={goBack}
          onCreated={async (car) => {
            if (session.demo) {
              setCars((current) => [...current, car]);
              setDetails((current) => ({ ...current, [car.id]: { car, violations: [], registration: null } }));
            } else {
              await refreshData();
            }
            replaceRoute({ name: 'vehicleAdded', car });
          }}
        />
      )}
      {route.name === 'editVehicle' && (
        <EditVehicleScreen
          carId={route.carId}
          details={details}
          goBack={goBack}
          onSave={saveVehicleChanges}
        />
      )}
      {route.name === 'notifications' && (
        <NotificationsScreen notifications={notifications} details={details} goBack={goBack} />
      )}
      {route.name === 'settings' && <SettingsScreen session={session} avatarIndex={avatarIndex} setRoute={navigate} goBack={goBack} onSignOut={() => void signOut()} />}
      {route.name === 'profileEdit' && <ProfileEditScreen session={session} avatarIndex={avatarIndex} onAvatarChange={(index) => void changeAvatar(index)} onSaveName={saveProfileName} goBack={goBack} />}
      {route.name === 'offer' && <OfferDetailScreen offerId={route.offerId} goBack={goBack} />}
      {route.name === 'vehicleAdded' && <VehicleAddedScreen car={route.car} openMain={openMain} setRoute={replaceRoute} />}
    </SafeAreaView>
  );
}

function LaunchScreen() {
  return (
    <View style={styles.launch}>
      <Image source={ICON} style={styles.launchIcon} />
      <Brand light centered />
      <Text style={styles.launchTag}>FINES · REGISTRATION · PEACE OF MIND</Text>
      <ActivityIndicator style={{ marginTop: 30 }} color={APP_GREEN} />
    </View>
  );
}

function WelcomeScreen({
  session,
  onContinue,
  onCreateAccount,
  onSignIn,
}: {
  session: Session | null;
  onContinue: () => void;
  onCreateAccount: () => void;
  onSignIn: () => void;
}) {
  const firstName = session?.user.full_name?.trim().split(/\s+/)[0] || 'Driver';
  return (
    <SafeAreaView style={styles.welcomePage}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.welcomeContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeBrandRow}><Brand light compact /></View>
        <View style={styles.welcomeEyebrow}><Text style={styles.welcomeEyebrowText}>NYC FINES · REGISTRATION · ALERTS</Text></View>
        <Text style={styles.welcomeTitle}>Your car, without the surprises.</Text>
        <Text style={styles.welcomeSubtitle}>Track fines, registration status, and every vehicle you care about from one calm dashboard.</Text>

        <View style={styles.welcomeHeroCard}>
          <View style={styles.welcomeHeroGlow} />
          <View style={styles.welcomeHeroTop}>
            <View>
              <Text style={styles.welcomeHeroLabel}>TIXRADAR</Text>
              <Text style={styles.welcomeHeroHeading}>Know sooner. Drive easier.</Text>
            </View>
            <View style={styles.welcomeLivePill}><View style={styles.welcomeLiveDot} /><Text style={styles.welcomeLiveText}>LIVE</Text></View>
          </View>
          <Image source={CAR_SEDAN} style={styles.welcomeCar} resizeMode="contain" />
          <View style={styles.welcomeAlertCard}>
            <View style={styles.welcomeAlertIcon}><IconImage source={ICON_NOTIFICATION} size={17} tint={APP_BLUE} /></View>
            <View style={{ flex: 1 }}><Text style={styles.welcomeAlertTitle}>Fine alerts</Text><Text style={styles.welcomeAlertSub}>Get notified when something new appears.</Text></View>
          </View>
        </View>

        <View style={styles.welcomeFeatureRow}>
          <WelcomeFeature icon={ICON_OUTSTANDING} title="Balances" />
          <WelcomeFeature icon={ICON_VEHICLES} title="Vehicles" />
          <WelcomeFeature icon={ICON_REGISTRATION_DETAIL} title="Registration" />
        </View>
      </ScrollView>
      <View style={styles.welcomeActions}>
        {session ? (
          <>
            <PrimaryButton title={`Continue as ${firstName}`} hideArrow onPress={onContinue} />
            <TouchableOpacity style={styles.welcomeSecondary} onPress={onCreateAccount}><Text style={styles.welcomeSecondaryText}>Create a new account</Text></TouchableOpacity>
            <TouchableOpacity style={styles.welcomeTextButton} onPress={onSignIn}><Text style={styles.welcomeTextButtonText}>Sign in with another account</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <PrimaryButton title="Create account" hideArrow onPress={onCreateAccount} />
            <TouchableOpacity style={styles.welcomeSecondary} onPress={onSignIn}><Text style={styles.welcomeSecondaryText}>I already have an account</Text></TouchableOpacity>
          </>
        )}
        <Text style={styles.welcomeLegal}>By continuing, you agree to Tixradar’s Terms of Service and Privacy Policy.</Text>
      </View>
    </SafeAreaView>
  );
}

function WelcomeFeature({ icon, title }: { icon: number; title: string }) {
  return <View style={styles.welcomeFeature}><View style={styles.welcomeFeatureIcon}><IconImage source={icon} size={17} tint={APP_TEXT} /></View><Text style={styles.welcomeFeatureText}>{title}</Text></View>;
}

function FineIllustration() {
  return (
    <View style={styles.fineIllustration}>
      <View style={styles.mapGrid} />
      <View style={styles.fineCardLarge}>
        <View style={styles.iconBubble}><IconImage source={ICON_WARNING} size={20} tint={INK} /></View>
        <Text style={styles.smallCaps}>NYC PARKING VIOLATION</Text>
        <Text style={styles.fineAmount}>$50.00</Text>
        <Text style={styles.fineMeta}>Camera Violation</Text>
        <Text style={styles.fineMeta}>E 14th St & 3rd Ave</Text>
        <Pill label="Found" tone="green" />
      </View>
      <Text style={styles.handNote}>Know sooner.\nDo more.</Text>
    </View>
  );
}

function VehiclesIllustration() {
  return (
    <View style={{ width: '100%', gap: 12 }}>
      <VehiclePreview image={CAR_WHITE} name="2022 Tesla Model 3" plate="KZP-7314" active />
      <VehiclePreview image={CAR_SUV} name="2020 Honda CR-V" plate="LFM-2901" />
      <VehiclePreview image={CAR_DARK} name="2018 BMW 330i" plate="HXT-8840" />
      <View style={styles.registrationPreview}>
        <View><Text style={styles.previewLabel}>Registration</Text><Text style={styles.previewSub}>Expires Jan 15, 2027</Text></View>
        <Pill label="Active" tone="green" />
      </View>
    </View>
  );
}

function VehiclePreview({ image, name, plate, active }: { image: number; name: string; plate: string; active?: boolean }) {
  return (
    <View style={[styles.vehiclePreview, active && styles.vehiclePreviewActive]}>
      <Image source={image} style={styles.vehiclePreviewImage} resizeMode="contain" />
      <View style={{ flex: 1 }}><Text style={styles.previewLabel}>{name}</Text><Text style={styles.previewSub}>{plate}</Text></View>
      <Chevron />
    </View>
  );
}

function AlertsIllustration() {
  return (
    <View style={{ width: '100%', gap: 12 }}>
      <NotificationPreview iconSource={ICON_WARNING} title="New Fine Detected" body="$50 camera violation on KZP-7314." time="2m" tone="red" />
      <NotificationPreview iconSource={ICON_NOTIFICATION} title="Registration Reminder" body="Your registration expires in 30 days." time="1d" tone="green" />
      <NotificationPreview iconSource={ICON_OUTSTANDING} title="Pay through CityPay" body="Copy the summons and open the official NYC payment site." time="" tone="dark" />
      <Text style={styles.handNote}>Less stress.\nMore driving.</Text>
    </View>
  );
}

function NotificationPreview({ iconSource, title, body, time, tone }: { iconSource: number; title: string; body: string; time: string; tone: 'red' | 'green' | 'dark' }) {
  const bg = tone === 'red' ? RED_SOFT : tone === 'green' ? '#EEFFE1' : SOFT;
  const fg = tone === 'red' ? RED : tone === 'green' ? GREEN_DARK : INK;
  return (
    <View style={styles.notificationPreview}>
      <View style={[styles.notificationIcon, { backgroundColor: bg }]}><IconImage source={iconSource} size={18} tint={fg} /></View>
      <View style={{ flex: 1 }}><Text style={styles.previewLabel}>{title}</Text><Text style={styles.previewSub}>{body}</Text></View>
      <Text style={styles.notificationTime}>{time}</Text>
    </View>
  );
}

function AuthScreen({
  mode,
  setMode,
  onSession,
  onBack,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  onSession: (session: Session, isNewAccount: boolean) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return setError('Enter your email and password.');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Enter a valid email address.');
    if (mode === 'signup' && password.length < 8) return setError('Use at least 8 characters for your password.');
    setLoading(true);
    try {
      const next = mode === 'signin' ? await login(cleanEmail, password) : await signup(cleanEmail, password);
      onSession(next, mode === 'signup');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function social(provider: SocialProvider) {
    setError('');
    setSocialLoading(provider);
    try {
      // Development preview keeps the complete social-registration UX testable before
      // production Apple/Google credentials are supplied. Production builds must exchange
      // a real provider token with the backend before App Store release.
      if (__DEV__) {
        const preview: Session = {
          ...DEMO_SESSION,
          demo: true,
          token: `preview-${provider}-${Date.now()}`,
          user: {
            ...DEMO_SESSION.user,
            id: provider === 'google' ? 91001 : 91002,
            email: provider === 'google' ? 'google.preview@tixradar.app' : 'apple.preview@tixradar.app',
            full_name: null,
          },
        };
        onSession(preview, true);
        return;
      }
      Alert.alert(
        `${provider === 'google' ? 'Google' : 'Apple'} Sign In`,
        'The account flow is ready. Add the production OAuth credentials and token verification before release.',
      );
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <SafeAreaView style={styles.authPage}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.authBackButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
            <IconImage source={ICON_ARROW} size={19} tint={APP_TEXT} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Brand light compact />
          <View style={styles.authModeSwitch}>
            <TouchableOpacity style={[styles.authModeOption, mode === 'signin' && styles.authModeOptionActive]} onPress={() => setMode('signin')}><Text style={[styles.authModeText, mode === 'signin' && styles.authModeTextActive]}>Sign in</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.authModeOption, mode === 'signup' && styles.authModeOptionActive]} onPress={() => setMode('signup')}><Text style={[styles.authModeText, mode === 'signup' && styles.authModeTextActive]}>Create account</Text></TouchableOpacity>
          </View>

          <Text style={styles.authTitle}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.authSubtitle}>
            {mode === 'signin'
              ? 'Sign in and get straight back to your vehicles.'
              : 'Start with an account. You’ll choose your nickname and avatar next.'}
          </Text>

          <TouchableOpacity style={styles.socialAuthButton} onPress={() => void social('apple')} disabled={!!socialLoading} activeOpacity={0.84}>
            <Text style={styles.appleMark}></Text><Text style={styles.socialAuthText}>{socialLoading === 'apple' ? 'Connecting…' : `Continue with Apple`}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialAuthButton} onPress={() => void social('google')} disabled={!!socialLoading} activeOpacity={0.84}>
            <View style={styles.googleMark}><Text style={styles.googleMarkText}>G</Text></View><Text style={styles.socialAuthText}>{socialLoading === 'google' ? 'Connecting…' : `Continue with Google`}</Text>
          </TouchableOpacity>

          <View style={styles.authDivider}><View style={styles.authDividerLine} /><Text style={styles.authDividerText}>or continue with email</Text><View style={styles.authDividerLine} /></View>

          <Label text="Email Address" />
          <Field plain placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
          <Label text="Password" />
          <Field
            plain
            placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType={mode === 'signup' ? 'newPassword' : 'password'}
            right={<TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}><Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text></TouchableOpacity>}
          />

          {mode === 'signup' ? (
            <View style={styles.passwordRules}>
              <Rule ok={password.length >= 8} text="At least 8 characters" />
              <Rule ok={/[A-Za-z]/.test(password) && /\d/.test(password)} text="One letter and one number" />
              <Rule ok={/[^A-Za-z0-9]/.test(password)} text="One special character" />
            </View>
          ) : <Text style={styles.sessionNote}>You’ll stay signed in on this device until you sign out.</Text>}

          {!!error && <Text style={styles.formError}>{error}</Text>}
          <PrimaryButton title={loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} hideArrow onPress={() => void submit()} disabled={loading || !!socialLoading} />

          {mode === 'signin' && Platform.OS === 'web' ? (
            <TouchableOpacity style={styles.demoButton} onPress={() => onSession(DEMO_SESSION, false)}>
              <Text style={styles.demoButtonText}>Preview the full app in demo mode</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.authSwitch} onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            <Text style={styles.authSwitchText}>
              {mode === 'signin' ? "New to Tixradar? " : 'Already registered? '}
              <Text style={styles.linkText}>{mode === 'signin' ? 'Create account' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>
          <Text style={styles.legalText}>By continuing, you agree to Tixradar’s Terms of Service and Privacy Policy.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileSetupScreen({
  session,
  initialAvatar,
  onComplete,
  onSignOut,
}: {
  session: Session;
  initialAvatar: number;
  onComplete: (nickname: string, avatar: number) => Promise<void>;
  onSignOut: () => void;
}) {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    const clean = nickname.trim();
    if (!clean) return setError('Choose a nickname.');
    setError('');
    setSaving(true);
    try {
      await onComplete(clean, selectedAvatar);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.setupPage}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.setupContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Brand light compact />
        <View style={styles.setupStepPill}><Text style={styles.setupStepText}>FINAL STEP</Text></View>
        <Text style={styles.setupTitle}>Make Tixradar yours.</Text>
        <Text style={styles.setupSubtitle}>Choose how you’ll appear in the app. You can change both anytime in Profile & Settings.</Text>

        <View style={styles.setupPreview}>
          <Image source={AVATAR_ASSETS[selectedAvatar]} style={styles.setupPreviewAvatar} resizeMode="cover" />
          <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.setupPreviewName}>{nickname.trim() || 'Your nickname'}</Text><Text style={styles.setupPreviewEmail} numberOfLines={1}>{session.user.email}</Text></View>
        </View>

        <SectionTitle title="Choose avatar" />
        <AvatarPicker selected={selectedAvatar} onChange={setSelectedAvatar} />
        <SectionTitle title="Nickname" />
        <Field value={nickname} onChangeText={setNickname} placeholder="John Driver" autoCapitalize="words" maxLength={40} />
        <Text style={styles.setupHint}>This is what you’ll see in the Home header.</Text>
        {!!error && <Text style={styles.formError}>{error}</Text>}
        <PrimaryButton title={saving ? 'Finishing setup…' : 'Continue to Tixradar'} hideArrow disabled={saving} onPress={() => void finish()} />
        <TouchableOpacity style={styles.setupChangeAccount} onPress={onSignOut}><Text style={styles.setupChangeAccountText}>Use a different account</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return <View style={styles.ruleRow}><View style={[styles.ruleDot, ok && styles.ruleDotOk]}><Text style={[styles.ruleCheck, ok && styles.ruleCheckOk]}>✓</Text></View><Text style={styles.ruleText}>{text}</Text></View>;
}

function HomeScreen({
  session,
  cars,
  details,
  notifications,
  setRoute,
  refreshData,
  refreshing,
  setRefreshing,
  loadingData,
  avatarSource,
}: {
  session: Session;
  cars: CarSummary[];
  details: Record<number, CarDetailResponse>;
  notifications: NotificationEvent[];
  setRoute: (route: Route) => void;
  openMain: (tab: MainTab) => void;
  refreshData: () => Promise<void>;
  refreshing: boolean;
  setRefreshing: (v: boolean) => void;
  loadingData: boolean;
  avatarSource: number;
}) {
  const allViolations = useMemo(() => flattenViolations(details), [details]);
  const open = allViolations.filter((x) => toMoney(x.violation.amount_due) > 0);
  const total = open.reduce((sum, x) => sum + toMoney(x.violation.amount_due), 0);
  const name = session.user.full_name?.split(' ')[0] || session.user.email.split('@')[0] || 'Driver';
  const hasDebt = total > 0;
  const hasOpenFines = open.length > 0;

  async function doRefresh() {
    setRefreshing(true);
    try { await refreshData(); } finally { setRefreshing(false); }
  }

  return (
    <View style={styles.screenFlex}>
      <AppScroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void doRefresh()} tintColor={APP_BLUE} />}>
        <View style={styles.homeHeader}>
          <TouchableOpacity style={styles.homeIdentity} onPress={() => setRoute({ name: 'settings' })} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel="Open profile and settings">
            <Image source={avatarSource} style={styles.homeAvatarImage} resizeMode="cover" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.homeHello} numberOfLines={1}>Hey! {name}</Text>
              <Text style={styles.homePrompt} numberOfLines={1}>Ready to stay ahead today?</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBell} onPress={() => setRoute({ name: 'notifications' })} accessibilityRole="button" accessibilityLabel="Open notifications">
            <IconImage source={ICON_NOTIFICATION} size={21} tint={APP_TEXT} />
            {notifications.length > 0 ? <View style={styles.notificationBadgeDot} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.homeMetricRow}>
          <DashboardMetricCard iconSource={ICON_OUTSTANDING} label="Fine balance" value={hasDebt ? `-$${formatCompactMoney(total)}` : '$0'} tone={hasDebt ? 'red' : 'green'} />
          <DashboardMetricCard iconSource={ICON_WARNING} label="Open fines" value={String(open.length)} tone={hasOpenFines ? 'red' : 'green'} />
          <DashboardMetricCard iconSource={ICON_VEHICLES} label="Vehicles" value={String(cars.length)} tone="blue" />
        </View>

        <SectionTitle title="My Vehicles" />
        {loadingData && cars.length === 0 ? (
          <View style={styles.loadingCard}><ActivityIndicator color={APP_BLUE} /><Text style={styles.mutedText}>Loading your vehicles…</Text></View>
        ) : (
          <View style={{ gap: 12 }}>
            {cars.map((car) => <VehicleCard key={car.id} car={car} detail={details[car.id]} onPress={() => setRoute({ name: 'carDetail', carId: car.id })} />)}
          </View>
        )}

        <TouchableOpacity style={styles.addVehicleDashed} onPress={() => setRoute({ name: 'addVehicle' })} activeOpacity={0.82}>
          <View style={styles.addSmallCircle}><Text style={styles.addSmallText}>＋</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.addVehicleTitle}>{cars.length ? 'Add Another Vehicle' : 'Add Your First Vehicle'}</Text>
            <Text style={styles.addVehicleSub}>Track another plate and VIN</Text>
          </View>
        </TouchableOpacity>
      </AppScroll>
    </View>
  );
}

function VehiclesScreen({
  cars,
  details,
  setRoute,
  openMain,
  refreshData,
}: {
  cars: CarSummary[];
  details: Record<number, CarDetailResponse>;
  setRoute: (route: Route) => void;
  openMain: (tab: MainTab) => void;
  refreshData: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'attention'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const filtered = cars.filter((car) => {
    if (filter === 'all') return true;
    const detail = details[car.id];
    const flags = registrationFlags(detail?.registration?.data);
    return filter === 'active' ? flags.length === 0 && carOpenCount(detail) === 0 : flags.length > 0 || carOpenCount(detail) > 0;
  });

  async function refresh() {
    setRefreshing(true);
    try { await refreshData(); } finally { setRefreshing(false); }
  }

  return (
    <View style={styles.screenFlex}>
      <AppScroll bottomInset refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN_DARK} />}>
        <Header
          title="My Vehicles"
          subtitle="Your saved cars, fines, and registration status."
          right={
            <TouchableOpacity style={styles.addCircle} onPress={() => setRoute({ name: 'addVehicle' })} accessibilityRole="button" accessibilityLabel="Add vehicle">
              <Text style={styles.addCircleText}>＋</Text>
            </TouchableOpacity>
          }
        />
        <View style={styles.segmentRow}>
          <Segment label={`All (${cars.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <Segment label="Clear" active={filter === 'active'} onPress={() => setFilter('active')} />
          <Segment label="Attention" active={filter === 'attention'} onPress={() => setFilter('attention')} />
        </View>
        <View style={{ gap: 12 }}>
          {filtered.map((car) => <VehicleCard key={car.id} car={car} detail={details[car.id]} onPress={() => setRoute({ name: 'carDetail', carId: car.id })} />)}
        </View>
        {cars.length === 0 ? (
          <EmptyCard iconSource={ICON_VEHICLES} title="Your garage is empty" body="Add a vehicle to start tracking fines and registration." button="Add Vehicle" onPress={() => setRoute({ name: 'addVehicle' })} />
        ) : filtered.length === 0 ? (
          <EmptyCard iconSource={filter === 'attention' ? ICON_WARNING : ICON_VEHICLES} title={filter === 'attention' ? 'Nothing needs attention' : 'No vehicles in this filter'} body={filter === 'attention' ? 'Your saved vehicles currently look clear.' : 'Try another filter to see your vehicles.'} />
        ) : null}
        {cars.length > 0 ? (
          <TouchableOpacity style={styles.addVehicleDashed} onPress={() => setRoute({ name: 'addVehicle' })}>
            <View style={styles.addSmallCircle}><Text style={styles.addSmallText}>＋</Text></View>
            <View><Text style={styles.addVehicleTitle}>Add Another Vehicle</Text><Text style={styles.addVehicleSub}>Track another plate and VIN</Text></View>
          </TouchableOpacity>
        ) : null}
      </AppScroll>
      <BottomNav active="vehicles" onTab={openMain} />
    </View>
  );
}

function VehicleCard({ car, detail, onPress }: { car: CarSummary; detail?: CarDetailResponse; onPress: () => void }) {
  const open = detail ? carOpenCount(detail) : Number(car.violation_count || 0);
  const flags = registrationFlags(detail?.registration?.data);
  const regLabel = flags.length ? 'Registration needs attention' : car.has_registration ? 'Registration active' : 'VIN not added';
  return (
    <TouchableOpacity style={styles.vehicleCard} onPress={onPress} activeOpacity={0.86} accessibilityRole="button" accessibilityLabel={`Open ${car.nickname}`}>
      <View style={styles.vehicleCardImageWrap}><Image source={carImageForCar(car)} style={styles.vehicleCardImage} resizeMode="contain" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.vehicleCardTitle} numberOfLines={1}>{car.nickname}</Text>
        <Text style={styles.vehicleCardPlate}>{car.plate} · {stateName(car.state)}</Text>
        <View style={styles.vehicleStatusRow}>
          <View style={[styles.statusDot, { backgroundColor: flags.length ? AMBER : APP_GREEN }]} />
          <Text style={styles.vehicleStatusText} numberOfLines={1}>{regLabel}</Text>
        </View>
        <View style={[styles.vehicleFineBadge, open > 0 ? styles.vehicleFineBadgeOpen : styles.vehicleFineBadgeClear]}>
          <IconImage source={open > 0 ? ICON_WARNING : ICON_FINES} size={12} tint={open > 0 ? APP_RED : APP_GREEN} />
          <Text style={[styles.vehicleFineBadgeText, open > 0 && { color: APP_RED }]}>{open > 0 ? `${open} open fine${open > 1 ? 's' : ''}` : 'No open fines'}</Text>
        </View>
      </View>
      <Chevron />
    </TouchableOpacity>
  );
}

function CarDetailScreen({
  carId,
  details,
  setRoute,
  goBack,
  openMain,
  onDelete,
}: {
  carId: number;
  details: Record<number, CarDetailResponse>;
  setRoute: (route: Route) => void;
  goBack: () => void;
  openMain: (tab: MainTab) => void;
  onDelete: (carId: number) => Promise<void>;
}) {
  const [tab, setTab] = useState<'overview' | 'fines'>('overview');
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const detail = details[carId];
  if (!detail) {
    return <CenteredState title="Vehicle unavailable" body="Refresh your garage and try again." onBack={goBack} />;
  }
  const { car } = detail;
  const reg = detail.registration?.data;
  const open = detail.violations.filter((v) => toMoney(v.amount_due) > 0);
  const flags = registrationFlags(reg);

  async function remove() {
    setDeleting(true);
    try {
      await onDelete(car.id);
      setShowActions(false);
      setConfirmDelete(false);
      openMain('home');
    } catch (err) {
      Alert.alert('Couldn’t remove vehicle', getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AppScroll bottomInset>
        <TopBack
          onPress={goBack}
          rightIconSource={ICON_MORE}
          onRightPress={() => setShowActions(true)}
          rightAccessibilityLabel="Vehicle options"
        />
        <View style={styles.vehicleDetailSummary}>
          <View style={styles.vehicleDetailImageBox}><Image source={carImageForCar(car)} style={styles.vehicleDetailImage} resizeMode="contain" /></View>
          <View style={styles.vehicleDetailMeta}>
            <Pill label={flags.length ? 'Attention' : reg ? 'Active' : 'Saved'} tone={flags.length ? 'amber' : 'green'} />
            <Text style={styles.detailTitle} numberOfLines={2}>{vehicleDisplayName(detail)}</Text>
            <Text style={styles.detailPlate}>{car.plate}</Text>
          </View>
        </View>
        <View style={styles.detailTabs}>
          <DetailTabButton label="Overview" active={tab === 'overview'} onPress={() => setTab('overview')} />
          <DetailTabButton label={`Fines (${open.length})`} active={tab === 'fines'} onPress={() => setTab('fines')} />
        </View>

        {tab === 'overview' ? (
          <View style={styles.overviewStack}>
            <InfoRow iconSource={ICON_PLATE_DETAIL} label="License Plate" value={`${car.plate} · ${stateName(car.state)}`} />
            <InfoRow
              iconSource={ICON_REGISTRATION_DETAIL}
              label="Registration Status"
              value={flags.length ? 'Needs attention' : reg ? 'Active' : car.vin ? 'No public record' : 'VIN not added'}
              accent={!flags.length && !!reg}
              helper={reg?.reg_expiration_date ? `Expires ${formatDate(reg.reg_expiration_date)}` : undefined}
            />
            <InfoRow
              iconSource={ICON_VIN}
              label="VIN"
              value={car.vin || 'Not added'}
              trailing={car.vin ? 'copy' : undefined}
              onTrailingPress={car.vin ? () => void copyText(car.vin || '', 'VIN copied') : undefined}
            />
          </View>
        ) : null}

        {tab === 'fines' ? (
          <View style={{ gap: 10 }}>
            {open.map((stored) => (
              <FineRow key={stored.id} violation={stored.data} onPress={() => setRoute({ name: 'violationDetail', violation: stored.data, carName: car.nickname })} />
            ))}
            {open.length === 0 ? <EmptyCard iconSource={ICON_FINES} title="No open fines" body="This vehicle is clear. New fines will appear here automatically when Tixradar detects them." /> : null}
          </View>
        ) : null}
      </AppScroll>

      <Modal transparent animationType="fade" visible={showActions} onRequestClose={() => { setShowActions(false); setConfirmDelete(false); }}>
        <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={() => { if (!deleting) { setShowActions(false); setConfirmDelete(false); } }}>
          <TouchableOpacity style={styles.vehicleActionSheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            {!confirmDelete ? (
              <>
                <Text style={styles.sheetTitle}>{car.nickname}</Text>
                <Text style={styles.sheetSub}>{car.plate} · {stateName(car.state)}</Text>
                <ActionSheetRow iconSource={ICON_VEHICLES} title="Edit vehicle" subtitle="Change nickname, plate, state, or VIN" onPress={() => { setShowActions(false); setRoute({ name: 'editVehicle', carId: car.id }); }} />
                <ActionSheetRow iconSource={ICON_WARNING} title="Remove vehicle" subtitle="Stop tracking this car" destructive onPress={() => setConfirmDelete(true)} />
                <TouchableOpacity style={styles.sheetCancelButton} onPress={() => setShowActions(false)}><Text style={styles.sheetCancelText}>Cancel</Text></TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.deleteWarningIcon}><IconImage source={ICON_WARNING} size={24} tint={APP_RED} /></View>
                <Text style={styles.sheetTitle}>Remove {car.nickname}?</Text>
                <Text style={styles.sheetSub}>This removes the vehicle and its saved tracking data from your Tixradar account. This can’t be undone.</Text>
                <TouchableOpacity style={[styles.destructiveButton, deleting && { opacity: 0.6 }]} disabled={deleting} onPress={() => void remove()}>
                  {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.destructiveButtonText}>Remove Vehicle</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetCancelButton} disabled={deleting} onPress={() => setConfirmDelete(false)}><Text style={styles.sheetCancelText}>Keep Vehicle</Text></TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function FinesScreen({
  cars,
  details,
  setRoute,
  openMain,
  refreshData,
}: {
  cars: CarSummary[];
  details: Record<number, CarDetailResponse>;
  setRoute: (route: Route) => void;
  openMain: (tab: MainTab) => void;
  refreshData: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const items = useMemo(() => flattenViolations(details), [details]);
  const filtered = items.filter((item) => filter === 'all' || (filter === 'unpaid' ? toMoney(item.violation.amount_due) > 0 : toMoney(item.violation.amount_due) === 0));
  const unpaid = items.filter((x) => toMoney(x.violation.amount_due) > 0).length;
  const paid = items.length - unpaid;

  async function refresh() {
    setRefreshing(true);
    try { await refreshData(); } finally { setRefreshing(false); }
  }

  return (
    <View style={styles.screenFlex}>
      <AppScroll bottomInset refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN_DARK} />}>
        <Header title="Fines" subtitle="Parking and camera violations across your garage." />
        <View style={styles.segmentRow}>
          <Segment label={`All (${items.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <Segment label={`Unpaid (${unpaid})`} active={filter === 'unpaid'} onPress={() => setFilter('unpaid')} />
          <Segment label={`Paid (${paid})`} active={filter === 'paid'} onPress={() => setFilter('paid')} />
        </View>
        <View style={{ gap: 10 }}>
          {filtered.map((item) => (
            <FineRow key={`${item.car.id}-${item.violation.summons_number}`} violation={item.violation} carName={item.car.nickname} onPress={() => setRoute({ name: 'violationDetail', violation: item.violation, carName: item.car.nickname })} />
          ))}
        </View>
        {filtered.length === 0 && (
          cars.length === 0
            ? <EmptyCard iconSource={ICON_VEHICLES} title="Add a vehicle first" body="Once you save a vehicle, its tracked NYC fines will appear here." button="Add Vehicle" onPress={() => setRoute({ name: 'addVehicle' })} />
            : <EmptyCard iconSource={ICON_FINES} title={filter === 'paid' ? 'No paid fines yet' : 'You’re clear'} body={filter === 'paid' ? 'Paid violations will remain available here for reference.' : 'No outstanding fines are saved right now.'} />
        )}
      </AppScroll>
      <BottomNav active="fines" onTab={openMain} />
    </View>
  );
}

function FineRow({ violation, carName, onPress }: { violation: Violation; carName?: string; onPress: () => void }) {
  const due = toMoney(violation.amount_due);
  return (
    <TouchableOpacity style={styles.fineRow} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
      <View style={[styles.fineTypeIcon, due > 0 ? styles.fineTypeIconOpen : styles.fineTypeIconPaid]}>
        <IconImage source={ICON_FINES} size={19} tint={due > 0 ? APP_RED : APP_GREEN} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.fineRowTitle} numberOfLines={1}>{friendlyViolation(violation.violation)}</Text>
        <Text style={styles.fineRowMeta} numberOfLines={1}>#{violation.summons_number}{carName ? ` · ${carName}` : ''}</Text>
        <Text style={styles.fineRowMeta} numberOfLines={1}>{formatIssueDate(violation.issue_date)}{violation.street_name ? ` · ${violation.street_name}` : ''}</Text>
      </View>
      <View style={styles.fineRight}><Text style={styles.fineRowAmount}>${due.toFixed(2)}</Text><Pill label={due > 0 ? 'Unpaid' : 'Paid'} tone={due > 0 ? 'red' : 'green'} /></View>
      <Chevron />
    </TouchableOpacity>
  );
}

function ViolationDetailScreen({ route, setRoute, goBack }: { route: Extract<Route, { name: 'violationDetail' }>; setRoute: (route: Route) => void; goBack: () => void }) {
  const v = route.violation;
  const due = toMoney(v.amount_due);
  return (
    <AppScroll bottomInset>
      <TopBack onPress={goBack} center="Fine Details" />
      <View style={styles.violationHeaderCard}>
        <View style={styles.violationHeaderTop}>
          <View style={[styles.redIcon, due === 0 && { backgroundColor: APP_GREEN_SOFT }]}><IconImage source={ICON_FINES} size={21} tint={due > 0 ? APP_RED : APP_GREEN} /></View>
          <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.violationHeaderTitle} numberOfLines={2}>{friendlyViolation(v.violation)}</Text><Text style={styles.violationHeaderSub}>Summons #{v.summons_number}</Text></View>
          <Pill label={due > 0 ? 'Unpaid' : 'Paid'} tone={due > 0 ? 'red' : 'green'} />
        </View>
        <Text style={styles.bigMoney}>${due.toFixed(2)}</Text>
      </View>
      <View style={styles.detailList}>
        <DetailLine iconSource={ICON_NOTIFICATION} label="Date" value={formatIssueDate(v.issue_date)} sub={v.violation_time || undefined} />
        <DetailLine iconSource={ICON_HOME} label="Location" value={violationLocation(v)} sub={v.county || 'New York, NY'} />
        <DetailLine iconSource={ICON_FINES} label="Violation" value={friendlyViolation(v.violation)} sub={v.violation_status || 'NYC parking/camera violation'} />
        <DetailLine iconSource={ICON_MORE} label="Issued By" value={v.issuing_agency || 'NYC Department of Finance'} />
        <DetailLine iconSource={ICON_VEHICLES} label="Vehicle" value={route.carName || `${v.plate} · ${v.state}`} sub={`${v.plate} · ${stateName(v.state)}`} />
      </View>
      <TouchableOpacity style={styles.copySummonsButton} onPress={() => void copySummons(v.summons_number)} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={`Copy summons ${v.summons_number}`}>
        <Text style={styles.copySummonsText} numberOfLines={1}>Copy summons: #{v.summons_number}</Text>
        <IconImage source={ICON_COPY_DETAIL} size={21} tint={APP_TEXT} />
      </TouchableOpacity>
      {due > 0 && <PrimaryButton title="Pay on NYC CityPay" hideArrow onPress={() => setRoute({ name: 'payment', violation: v })} />}
    </AppScroll>
  );
}

function PaymentScreen({ violation, goBack }: { violation: Violation; goBack: () => void }) {
  async function openCityPay() {
    await Clipboard.setStringAsync(violation.summons_number);
    await Linking.openURL(CITYPAY_URL);
  }
  return (
    <View style={styles.paymentPage}>
      <View style={styles.fixedScreenInner}>
        <TopBack onPress={goBack} />
        <View style={styles.paymentCenter}>
          <View style={styles.externalIconWrap}>
            <IconImage source={ICON_OUTSTANDING} size={31} tint={INK} />
            <View style={styles.externalGreen}><IconImage source={ICON_ARROW} size={18} tint={APP_TEXT} /></View>
          </View>
          <Text style={styles.paymentTitle}>Pay on NYC CityPay</Text>
          <Text style={styles.paymentSub}>Tixradar doesn’t collect fine payments. We’ll copy your summons number and open the official NYC CityPay website.</Text>
          <View style={styles.trustCard}>
            <TrustLine iconSource={ICON_HOME} title="Official NYC website" body="Payment happens directly with New York City." />
            <TrustLine iconSource={ICON_FINES} title="Summons ready" body={`#${violation.summons_number} will be copied before CityPay opens.`} />
            <TrustLine iconSource={ICON_ARROW} title="Secure handoff" body="Complete payment in your browser, then return to Tixradar." />
          </View>
        </View>
        <View style={styles.paymentBottom}><PrimaryButton title="Open CityPay" hideArrow onPress={() => void openCityPay()} /><TouchableOpacity onPress={goBack}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity></View>
      </View>
    </View>
  );
}

function LookupScreen({ mode, setRoute, goBack }: { mode: LookupMode; setRoute: (route: Route) => void; goBack: () => void }) {
  const [plate, setPlate] = useState('');
  const [state, setState] = useState('NY');
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<Array<{ plate: string; state: string }>>([]);

  useEffect(() => {
    if (mode !== 'plate') return;
    void AsyncStorage.getItem(RECENT_LOOKUPS_KEY).then((value) => {
      if (!value) return;
      try { setRecent(JSON.parse(value)); } catch { setRecent([]); }
    });
  }, [mode]);

  async function rememberLookup(nextPlate: string, nextState: string) {
    const next = [
      { plate: nextPlate.toUpperCase(), state: nextState.toUpperCase() },
      ...recent.filter((item) => !(item.plate === nextPlate.toUpperCase() && item.state === nextState.toUpperCase())),
    ].slice(0, 5);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_LOOKUPS_KEY, JSON.stringify(next));
  }

  async function clearRecent() {
    setRecent([]);
    await AsyncStorage.removeItem(RECENT_LOOKUPS_KEY);
  }

  async function submit() {
    setError('');
    setLoading(true);
    try {
      if (mode === 'plate') {
        const normalizedPlate = plate.trim().toUpperCase();
        if (!normalizedPlate) throw new Error('Enter a license plate.');
        if (normalizedPlate.length > 12) throw new Error('Check the license plate and try again.');
        const result = await fetchViolations(normalizedPlate, state);
        await rememberLookup(result.plate, result.state);
        setRoute({ name: 'lookupResults', plate: result.plate, state: result.state, violations: result.violations });
      } else {
        const normalizedVin = normalizeVin(vin);
        if (!isValidVin(normalizedVin)) throw new Error('Enter a valid 17-character VIN.');
        const result = await fetchRegistration(normalizedVin);
        setRoute({ name: 'registrationResults', vin: result.vin, registrations: result.registrations });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScroll>
      <TopBack onPress={goBack} />
      <View style={styles.lookupIcon}><IconImage source={mode === 'plate' ? ICON_SEARCH : ICON_VIN} size={30} tint={INK} /></View>
      <Text style={styles.lookupTitle}>{mode === 'plate' ? 'Check a Plate' : 'Check a VIN'}</Text>
      <Text style={styles.lookupSub}>{mode === 'plate' ? 'Enter a license plate to check NYC parking and camera violations.' : 'Enter a VIN to check public New York DMV registration information.'}</Text>
      {mode === 'plate' ? (
        <>
          <Label text="License Plate" /><Field plain placeholder="KZP-7314" value={plate} onChangeText={(v) => setPlate(v.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={12} returnKeyType="next" />
          <Label text="State" /><PickerField value={state} onValueChange={setState} values={US_STATES} />
        </>
      ) : (
        <><Label text="VIN" /><Field plain placeholder="5YJ3E1EA7NF324518" value={vin} onChangeText={(v) => setVin(normalizeVin(v))} autoCapitalize="characters" autoCorrect={false} maxLength={17} /></>
      )}
      {!!error && <Text style={styles.formError}>{error}</Text>}
      <PrimaryButton title={loading ? 'Checking…' : mode === 'plate' ? 'Check Plate' : 'Check VIN'} iconSource={mode === 'plate' ? ICON_SEARCH : ICON_VIN} onPress={() => void submit()} disabled={loading} />
      {mode === 'plate' && recent.length > 0 ? (
        <View style={{ marginTop: 30 }}>
          <SectionTitle title="Recent lookups" action="Clear" onAction={() => void clearRecent()} />
          {recent.map((item) => <RecentLookup key={`${item.state}-${item.plate}`} plate={item.plate} state={stateName(item.state)} onPress={() => { setPlate(item.plate); setState(item.state); }} />)}
        </View>
      ) : null}
    </AppScroll>
  );
}

function LookupResultsScreen({ route, setRoute, goBack }: { route: Extract<Route, { name: 'lookupResults' }>; setRoute: (route: Route) => void; goBack: () => void }) {
  const open = route.violations.filter((v) => toMoney(v.amount_due) > 0);
  const total = open.reduce((s, v) => s + toMoney(v.amount_due), 0);
  return (
    <AppScroll bottomInset>
      <TopBack onPress={goBack} center="Plate Results" />
      <View style={styles.lookupResultHero}><Image source={CAR_SEDAN} style={styles.lookupResultCar} resizeMode="contain" /><Pill label="Lookup complete" tone="green" /></View>
      <Text style={styles.resultPlate}>{route.plate}</Text><Text style={styles.resultState}>{stateName(route.state)}</Text>
      <View style={styles.twoCol}><StatCard iconSource={ICON_WARNING} value={String(open.length)} label="Open fines" tone="red" /><StatCard iconSource={ICON_OUTSTANDING} value={`$${total.toFixed(2)}`} label="Outstanding" tone="green" /></View>
      <View style={styles.lookupInfoCard}><View style={styles.lookupInfoIcon}><IconImage source={ICON_SEARCH} size={18} tint={INK} /></View><View style={{ flex: 1 }}><Text style={styles.previewLabel}>NYC violation lookup</Text><Text style={styles.previewSub}>Parking and camera violations returned by the public NYC dataset.</Text></View></View>
      <SectionTitle title={`Outstanding fines (${open.length})`} />
      <View style={{ gap: 10 }}>
        {open.map((v) => <FineRow key={v.summons_number} violation={v} onPress={() => setRoute({ name: 'violationDetail', violation: v })} />)}
      </View>
      {open.length === 0 && <EmptyCard iconSource={ICON_FINES} title="No open fines found" body="No outstanding NYC parking or camera violations were returned for this plate." />}
    </AppScroll>
  );
}

function RegistrationResultsScreen({ route, goBack }: { route: Extract<Route, { name: 'registrationResults' }>; goBack: () => void }) {
  const reg = route.registrations[0];
  const flags = registrationFlags(reg);
  return (
    <AppScroll>
      <TopBack onPress={goBack} center="VIN Results" />
      <View style={[styles.successBadge, !reg && styles.errorBadge]}>{reg ? <Text style={styles.successCheck}>✓</Text> : <IconImage source={ICON_WARNING} size={28} tint={APP_RED} />}</View>
      <Text style={styles.lookupTitle}>{reg ? 'Registration Found' : 'No Public Record Found'}</Text>
      <Text style={styles.lookupSub}>{reg ? 'Here’s the public DMV registration information available for this VIN.' : 'The public New York DMV dataset didn’t return a registration record for this VIN.'}</Text>
      {reg && (
        <View style={styles.detailList}>
          <DetailLine iconSource={ICON_VIN} label="VIN" value={route.vin} />
          <DetailLine iconSource={ICON_VEHICLES} label="Vehicle" value={`${reg.model_year || ''} ${reg.make || ''} ${reg.body_type || ''}`.trim() || 'Vehicle'} />
          <DetailLine iconSource={flags.length ? ICON_WARNING : ICON_VEHICLES} label="Registration" value={flags.length ? 'Needs attention' : 'Active'} />
          <DetailLine iconSource={ICON_NOTIFICATION} label="Expires" value={formatDate(reg.reg_expiration_date)} />
          <DetailLine iconSource={ICON_HOME} label="Location" value={[reg.city, reg.state, reg.zip].filter(Boolean).join(', ')} />
        </View>
      )}
      <View style={styles.sourceInfoBox}><IconImage source={ICON_MORE} size={17} tint={MUTED} /><Text style={styles.sourceNoteInline}>Public VIN lookup only. New York’s public registration dataset does not expose plate-to-registration linkage.</Text></View>
    </AppScroll>
  );
}

function AddVehicleScreen({ session, goBack, onCreated }: { session: Session; goBack: () => void; onCreated: (car: CarSummary) => void }) {
  const [nickname, setNickname] = useState('');
  const [plate, setPlate] = useState('');
  const [state, setState] = useState('NY');
  const [vin, setVin] = useState('');
  const [vehicleIcon, setVehicleIcon] = useState<VehicleIconKey>('sedan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    const cleanNickname = nickname.trim();
    const cleanPlate = plate.trim().toUpperCase();
    const cleanVin = normalizeVin(vin);
    if (!cleanNickname) return setError('Give this vehicle a nickname.');
    if (!cleanPlate) return setError('Enter the license plate.');
    if (cleanVin && !isValidVin(cleanVin)) return setError('VIN must be 17 valid characters, or leave it blank.');
    setLoading(true);
    try {
      if (session.demo) {
        const car: CarSummary = { id: Date.now(), nickname: cleanNickname, plate: cleanPlate, state, vin: cleanVin || null, vehicle_icon: vehicleIcon, violation_count: 0, total_amount_due: 0, has_registration: Boolean(cleanVin) };
        onCreated(car);
      } else {
        const result = await createCar(session.token, { nickname: cleanNickname, plate: cleanPlate, state, vin: cleanVin || undefined, vehicle_icon: vehicleIcon });
        onCreated(result.car);
      }
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }

  return (
    <AppScroll>
      <TopBack onPress={goBack} left="×" />
      <Text style={styles.lookupTitle}>Add a Vehicle</Text>
      <Text style={styles.lookupSub}>Choose the vehicle shape, then add the plate and optional VIN.</Text>
      <Label text="Choose Vehicle" />
      <VehicleIconSelector value={vehicleIcon} onChange={setVehicleIcon} />
      <Label text="Vehicle Nickname" /><Field plain placeholder="My car" value={nickname} onChangeText={setNickname} autoCapitalize="words" maxLength={40} />
      <Text style={styles.helperText}>Something easy to recognize, like Family SUV or Work Car.</Text>
      <Label text="License Plate" /><Field plain placeholder="KZP-7314" value={plate} onChangeText={(v) => setPlate(v.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={12} />
      <Label text="State" /><PickerField value={state} onValueChange={setState} values={US_STATES} />
      <Label text="VIN (Optional)" /><Field plain placeholder="5YJ3E1EA7NF324518" value={vin} onChangeText={(v) => setVin(normalizeVin(v))} autoCapitalize="characters" autoCorrect={false} maxLength={17} />
      <Text style={styles.helperText}>VINs are 17 characters. Letters I, O, and Q are not used.</Text>
      {!!error && <Text style={styles.formError}>{error}</Text>}
      <PrimaryButton title={loading ? 'Adding Vehicle…' : 'Add Vehicle'} onPress={() => void submit()} disabled={loading} hideArrow />
    </AppScroll>
  );
}

function EditVehicleScreen({
  carId,
  details,
  goBack,
  onSave,
}: {
  carId: number;
  details: Record<number, CarDetailResponse>;
  goBack: () => void;
  onSave: (carId: number, input: { nickname: string; plate: string; state: string; vin?: string; vehicle_icon?: string }) => Promise<CarSummary>;
}) {
  const detail = details[carId];
  const car = detail?.car;
  const [nickname, setNickname] = useState(car?.nickname || '');
  const [plate, setPlate] = useState(car?.plate || '');
  const [state, setState] = useState(car?.state || 'NY');
  const [vin, setVin] = useState(car?.vin || '');
  const [vehicleIcon, setVehicleIcon] = useState<VehicleIconKey>(normalizeVehicleIcon(car?.vehicle_icon));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!car) return <CenteredState title="Vehicle unavailable" body="Go back to your garage and try again." onBack={goBack} />;

  async function submit() {
    setError('');
    const cleanNickname = nickname.trim();
    const cleanPlate = plate.trim().toUpperCase();
    const cleanVin = normalizeVin(vin);
    if (!cleanNickname || !cleanPlate) return setError('Nickname and license plate are required.');
    if (cleanVin && !isValidVin(cleanVin)) return setError('VIN must be 17 valid characters, or leave it blank.');
    setLoading(true);
    try {
      await onSave(car.id, { nickname: cleanNickname, plate: cleanPlate, state, vin: cleanVin || undefined, vehicle_icon: vehicleIcon });
      goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScroll>
      <TopBack onPress={goBack} center="Edit Vehicle" />
      <Label text="Vehicle Shape" /><VehicleIconSelector value={vehicleIcon} onChange={setVehicleIcon} />
      <Label text="Vehicle Nickname" /><Field plain value={nickname} onChangeText={setNickname} autoCapitalize="words" maxLength={40} />
      <Label text="License Plate" /><Field plain value={plate} onChangeText={(v) => setPlate(v.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={12} />
      <Label text="State" /><PickerField value={state} onValueChange={setState} values={US_STATES} />
      <Label text="VIN (Optional)" /><Field plain placeholder="Add VIN" value={vin} onChangeText={(v) => setVin(normalizeVin(v))} autoCapitalize="characters" autoCorrect={false} maxLength={17} />
      <View style={styles.editNotice}><IconImage source={ICON_MORE} size={16} tint={APP_MUTED} /><Text style={styles.editNoticeText}>Changing the plate or state refreshes tracked fines. Changing the VIN refreshes registration data.</Text></View>
      {!!error && <Text style={styles.formError}>{error}</Text>}
      <PrimaryButton title={loading ? 'Saving…' : 'Save Changes'} iconSource={ICON_VEHICLES} onPress={() => void submit()} disabled={loading} />
    </AppScroll>
  );
}

function VehicleAddedScreen({ car, openMain, setRoute }: { car: CarSummary; openMain: (tab: MainTab) => void; setRoute: (route: Route) => void }) {
  return (
    <View style={styles.successPage}>
      <View style={styles.fixedScreenInnerCenter}>
        <View style={styles.successBadge}><Text style={styles.successCheck}>✓</Text></View>
        <Text style={styles.successTitle}>Vehicle Added</Text>
        <Text style={styles.successSub}>Tixradar is ready to track this vehicle’s fines and registration information.</Text>
        <Image source={carImageForCar(car)} style={styles.successCar} resizeMode="contain" />
        <TouchableOpacity style={styles.successCarCard} onPress={() => setRoute({ name: 'carDetail', carId: car.id })} activeOpacity={0.85}>
          <View><Text style={styles.vehicleCardTitle}>{car.nickname}</Text><Text style={styles.vehicleCardPlate}>{car.plate} · {stateName(car.state)}</Text></View><Chevron />
        </TouchableOpacity>
        <PrimaryButton title="View Vehicle" iconSource={ICON_VEHICLES} onPress={() => setRoute({ name: 'carDetail', carId: car.id })} />
        <SecondaryButton title="Back to Home" iconSource={ICON_HOME} onPress={() => openMain('home')} />
      </View>
    </View>
  );
}

function OfferDetailScreen({ offerId, goBack }: { offerId: OfferId; goBack: () => void }) {
  const offer = OFFERS.find((item) => item.id === offerId) || OFFERS[0];
  const [claimed, setClaimed] = useState(false);
  async function copyCode() {
    await Clipboard.setStringAsync(offer.code);
    Alert.alert('Code copied', `${offer.code} is ready to use.`);
  }
  return (
    <AppScroll>
      <TopBack onPress={goBack} center="Offer" />
      <Image source={offer.image} style={styles.offerDetailImage} resizeMode="cover" />
      <View style={styles.offerEyebrowRow}><Pill label="Tixradar offer" tone="green" /><Text style={styles.offerDiscount}>20% OFF</Text></View>
      <Text style={styles.offerDetailTitle}>{offer.title}</Text>
      <Text style={styles.offerDetailSub}>{offer.short}</Text>
      <View style={styles.offerInfoCard}>
        <Text style={styles.offerInfoLabel}>Where to use it</Text>
        <Text style={styles.offerInfoValue}>{offer.partner}</Text>
        <View style={styles.offerInfoDivider} />
        <Text style={styles.offerInfoLabel}>How it works</Text>
        <Text style={styles.offerInfoBody}>Claim the offer in Tixradar, then show the code at the participating location before checkout.</Text>
      </View>
      {!claimed ? (
        <PrimaryButton title="Claim 20% Off" iconSource={ICON_OUTSTANDING} onPress={() => setClaimed(true)} />
      ) : (
        <View style={styles.claimCard}>
          <View style={styles.claimCheck}><Text style={styles.claimCheckText}>✓</Text></View>
          <View style={{ flex: 1 }}><Text style={styles.claimTitle}>Offer claimed</Text><Text style={styles.claimSub}>Tap the code to copy it</Text></View>
          <TouchableOpacity onPress={() => void copyCode()} style={styles.claimCodeButton}><Text style={styles.claimCode}>{offer.code}</Text><Text style={styles.claimCopy}>Copy</Text></TouchableOpacity>
        </View>
      )}
      <Text style={styles.offerTerms}>{offer.terms}</Text>
    </AppScroll>
  );
}

type ActivityCategory = 'fines' | 'reminders';
type ActivityItem = { id: string; category: ActivityCategory; iconSource: number; title: string; body: string; time: string; tone: 'red' | 'green' | 'blue' };

function NotificationsScreen({ notifications, details, goBack }: { notifications: NotificationEvent[]; details: Record<number, CarDetailResponse>; goBack: () => void }) {
  const fineItems: ActivityItem[] = notifications
    .filter((n) => n.kind !== 'weekly_reminder')
    .map((n) => ({
      id: `fine-${n.id}`, category: 'fines', iconSource: ICON_WARNING,
      title: n.title || n.violation || 'New fine detected',
      body: n.body || `${toMoney(n.amount_due) > 0 ? `$${formatCompactMoney(toMoney(n.amount_due))} due · ` : ''}${n.nickname} · ${n.plate}`,
      time: timeAgo(n.created_at), tone: 'red',
    }));
  const backendReminderItems: ActivityItem[] = notifications
    .filter((n) => n.kind === 'weekly_reminder')
    .map((n) => ({
      id: `reminder-${n.id}`, category: 'reminders', iconSource: ICON_WEEKLY_DETAIL,
      title: n.title || 'Weekly fine reminder', body: n.body || `${n.nickname} still has open fines to review.`,
      time: timeAgo(n.created_at), tone: 'blue',
    }));
  const reminderCarIds = new Set(notifications.filter((n) => n.kind === 'weekly_reminder').map((n) => n.car_id));
  const synthesizedReminderItems: ActivityItem[] = Object.values(details)
    .filter((detail) => !reminderCarIds.has(detail.car.id))
    .map((detail) => ({ detail, open: detail.violations.filter((item) => toMoney(item.amount_due) > 0) }))
    .filter(({ open }) => open.length > 0)
    .map(({ detail, open }) => ({
      id: `weekly-${detail.car.id}`, category: 'reminders' as const, iconSource: ICON_WEEKLY_DETAIL,
      title: 'Weekly fine reminder',
      body: `${detail.car.nickname} has ${open.length} open fine${open.length === 1 ? '' : 's'} totaling $${formatCompactMoney(open.reduce((sum, item) => sum + toMoney(item.amount_due), 0))}.`,
      time: 'Weekly', tone: 'blue' as const,
    }));
  const allItems = [...fineItems, ...backendReminderItems, ...synthesizedReminderItems];

  return (
    <AppScroll>
      <TopBack onPress={goBack} />
      <Header title="Notifications" subtitle="Fine alerts and weekly reminders in one place." />
      <View style={{ gap: 10 }}>{allItems.map((item) => <ActivityStatic key={item.id} {...item} />)}</View>
      {allItems.length === 0 ? <EmptyCard iconSource={ICON_NOTIFICATION} title="You’re all caught up" body="New fine alerts and weekly reminders will appear here." /> : null}
    </AppScroll>
  );
}

function ActivityStatic({ iconSource, title, body, time, tone }: { iconSource: number; title: string; body: string; time: string; tone: 'red' | 'green' | 'blue' }) {
  const bg = tone === 'red' ? APP_RED_SOFT : tone === 'green' ? APP_GREEN_SOFT : APP_BLUE_SOFT;
  const fg = tone === 'red' ? APP_RED : tone === 'green' ? APP_GREEN : APP_BLUE;
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: bg }]}><IconImage source={iconSource} size={18} tint={fg} /></View>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.activityTitle}>{title}</Text><Text style={styles.activityBody}>{body}</Text></View>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}

function MoreScreen({ session, openMain, setRoute, onSignOut }: { session: Session; openMain: (tab: MainTab) => void; setRoute: (route: Route) => void; onSignOut: () => void }) {
  return (
    <View style={styles.screenFlex}>
      <AppScroll bottomInset>
        <Header title="More" subtitle="Account, alerts, and app preferences." />
        <ProfileCard session={session} onPress={() => setRoute({ name: 'settings' })} />
        <MenuRow iconSource={ICON_NOTIFICATION} title="Notifications" subtitle="New fines and weekly reminders" onPress={() => setRoute({ name: 'notifications' })} />
        <MenuRow iconSource={ICON_MORE} title="Settings" subtitle="Preferences and account" onPress={() => setRoute({ name: 'settings' })} />
        <MenuRow iconSource={ICON_HOME} title="About Tixradar" subtitle="Version 1.5.0 · NYC vehicle tracking" onPress={() => Alert.alert('About Tixradar', 'Tixradar helps you monitor NYC parking and camera fines plus public NY DMV registration information.')} />
        <TouchableOpacity style={styles.signOutRow} onPress={onSignOut}><Text style={styles.signOutText}>Sign Out</Text></TouchableOpacity>
      </AppScroll>
      <BottomNav active="more" onTab={openMain} />
    </View>
  );
}

function SettingsScreen({ session, avatarIndex, setRoute, goBack, onSignOut }: { session: Session; avatarIndex: number; setRoute: (route: Route) => void; goBack: () => void; onSignOut: () => void }) {
  const [fineAlerts, setFineAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(NOTIFICATION_PREFS_KEY).then((value) => {
      if (!value) return;
      try {
        const prefs = JSON.parse(value) as { fineAlerts?: boolean; weeklySummary?: boolean };
        if (typeof prefs.fineAlerts === 'boolean') setFineAlerts(prefs.fineAlerts);
        if (typeof prefs.weeklySummary === 'boolean') setWeeklySummary(prefs.weeklySummary);
      } catch { /* ignore corrupt preference cache */ }
    });
  }, []);

  async function savePrefs(next: { fineAlerts: boolean; weeklySummary: boolean }) {
    setFineAlerts(next.fineAlerts); setWeeklySummary(next.weeklySummary);
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
  }

  return (
    <AppScroll>
      <TopBack onPress={goBack} />
      <Header title="Profile & Settings" subtitle="Personalize Tixradar and manage your alerts." />
      <ProfileCard session={session} avatarSource={AVATAR_ASSETS[avatarIndex]} onPress={() => setRoute({ name: 'profileEdit' })} />
      <SectionTitle title="Preferences" />
      <MenuRow iconSource={ICON_NOTIFICATION} title="Notification Preferences" subtitle="New fines and weekly reminders" onPress={() => setShowPrefs(true)} />
      <MenuRow iconSource={ICON_MORE} title="Privacy & Data" subtitle="How Tixradar uses saved vehicle data" onPress={() => Alert.alert('Privacy & Data', 'Tixradar stores the vehicles you add so it can monitor public fine and registration datasets. Production privacy-policy links should be connected before App Store submission.')} />
      <SectionTitle title="Account" />
      <TouchableOpacity style={styles.signOutRow} onPress={onSignOut}><Text style={styles.signOutText}>Sign Out</Text></TouchableOpacity>
      <Text style={styles.settingsVersion}>Tixradar 1.5.0</Text>

      <Modal animationType="slide" transparent visible={showPrefs} onRequestClose={() => setShowPrefs(false)}>
        <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={() => setShowPrefs(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Notification Preferences</Text>
            <Text style={styles.sheetSub}>Choose which Tixradar updates you want to see.</Text>
            <ToggleRow iconSource={ICON_WARNING} title="New fine alerts" subtitle="Notify me when Tixradar detects a new fine" value={fineAlerts} onValueChange={(value) => void savePrefs({ fineAlerts: value, weeklySummary })} />
            <ToggleRow iconSource={ICON_WEEKLY_DETAIL} title="Weekly fine reminder" subtitle="Remind me weekly while I still have unpaid fines" value={weeklySummary} onValueChange={(value) => void savePrefs({ fineAlerts, weeklySummary: value })} />
            <PrimaryButton title="Done" hideArrow onPress={() => setShowPrefs(false)} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </AppScroll>
  );
}

function ProfileEditScreen({ session, avatarIndex, onAvatarChange, onSaveName, goBack }: { session: Session; avatarIndex: number; onAvatarChange: (index: number) => void; onSaveName: (fullName: string) => Promise<void>; goBack: () => void }) {
  const [nickname, setNickname] = useState(session.user.full_name || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSaveName(nickname);
      goBack();
    } catch (err) {
      Alert.alert('Couldn’t save profile', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScroll>
      <TopBack onPress={goBack} center="Edit Profile" />
      <View style={styles.profileEditPreview}>
        <Image source={AVATAR_ASSETS[avatarIndex]} style={styles.profileEditAvatar} resizeMode="cover" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.profileEditName} numberOfLines={1}>{nickname.trim() || 'Tixradar Driver'}</Text>
          <Text style={styles.profileEditHint}>This is how you’ll appear in the app.</Text>
        </View>
      </View>
      <SectionTitle title="Choose Avatar" />
      <AvatarPicker selected={avatarIndex} onChange={onAvatarChange} />
      <SectionTitle title="Nickname" />
      <Label text="Nickname" />
      <Field value={nickname} onChangeText={setNickname} placeholder="John Driver" autoCapitalize="words" maxLength={40} />
      <Text style={styles.profileFieldHint}>You can change this anytime. Email and phone settings can be added here later.</Text>
      <PrimaryButton title={saving ? 'Saving…' : 'Save Changes'} hideArrow disabled={saving} onPress={() => void save()} />
    </AppScroll>
  );
}

// ---------- Reusable UI ----------

function AppScroll({ children, bottomInset, refreshControl }: { children: ReactNode; bottomInset?: boolean; refreshControl?: ReactElement<any> }) {
  return (
    <ScrollView
      style={styles.appScroll}
      contentContainerStyle={[styles.appScrollContent, bottomInset && { paddingBottom: 44 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

function Brand({ light = false, centered = false, compact = false }: { light?: boolean; centered?: boolean; compact?: boolean }) {
  return (
    <View style={[styles.brand, centered && { justifyContent: 'center' }]}>
      <Image source={light ? WORDMARK_DARK : BRAND_BLACK} style={[styles.brandWordmark, compact && styles.brandWordmarkCompact]} resizeMode="contain" />
    </View>
  );
}

function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return <View style={styles.header}><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.headerTitle}>{title}</Text>{subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}</View>{right}</View>;
}

function TopBack({
  onPress,
  left = 'back',
  center,
  rightIconSource,
  onRightPress,
  rightAccessibilityLabel,
  darkTheme = true,
}: {
  onPress: () => void;
  left?: string;
  center?: string;
  rightIconSource?: number;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  darkTheme?: boolean;
}) {
  return (
    <View style={styles.topBackRow}>
      <TouchableOpacity style={styles.topBackButton} onPress={onPress} accessibilityRole="button" accessibilityLabel={left === 'back' ? 'Go back' : 'Close'}>
        {left === 'back' ? <IconImage source={ICON_ARROW} size={20} tint={darkTheme ? APP_TEXT : INK} style={{ transform: [{ rotate: '180deg' }] }} /> : <Text style={[styles.topBackGlyph, !darkTheme && { color: INK }]}>{left}</Text>}
      </TouchableOpacity>
      {center ? <Text style={styles.topBackCenter} numberOfLines={1}>{center}</Text> : <View style={{ flex: 1 }} />}
      {rightIconSource && onRightPress ? (
        <TouchableOpacity style={styles.topBackButton} onPress={onRightPress} accessibilityRole="button" accessibilityLabel={rightAccessibilityLabel || 'More options'}>
          <IconImage source={rightIconSource} size={20} tint={darkTheme ? APP_TEXT : INK} />
        </TouchableOpacity>
      ) : <View style={{ width: 44 }} />}
    </View>
  );
}

function PrimaryButton({ title, onPress, icon, iconSource, dark, disabled, hideArrow }: { title: string; onPress: () => void; icon?: string; iconSource?: number; dark?: boolean; disabled?: boolean; hideArrow?: boolean }) {
  const tint = '#FFFFFF';
  return (
    <TouchableOpacity style={[styles.primaryButton, dark && styles.primaryButtonDark, disabled && { opacity: 0.55 }]} onPress={onPress} disabled={disabled} activeOpacity={0.82} accessibilityRole="button">
      {iconSource ? <IconImage source={iconSource} size={20} tint={tint} style={styles.buttonImageIcon} /> : icon ? <Text style={styles.primaryButtonIcon}>{icon}</Text> : null}
      <Text style={styles.primaryButtonText} numberOfLines={1}>{title}</Text>
      {!hideArrow ? <IconImage source={ICON_ARROW} size={18} tint={tint} /> : null}
    </TouchableOpacity>
  );
}

function SecondaryButton({ title, onPress, icon, iconSource }: { title: string; onPress: () => void; icon?: string; iconSource?: number }) {
  return (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress} activeOpacity={0.82} accessibilityRole="button">
      {iconSource ? <IconImage source={iconSource} size={20} tint={APP_TEXT} style={styles.buttonImageIcon} /> : icon ? <Text style={styles.secondaryIcon}>{icon}</Text> : null}
      <Text style={styles.secondaryText} numberOfLines={1}>{title}</Text>
      <IconImage source={ICON_ARROW} size={18} tint={APP_TEXT} />
    </TouchableOpacity>
  );
}

function Field({ icon, right, plain, ...props }: ComponentProps<typeof TextInput> & { icon?: string; right?: ReactNode; plain?: boolean }) {
  return <View style={[styles.fieldWrap, plain && { marginTop: 0 }]}>{icon ? <Text style={styles.fieldIcon}>{icon}</Text> : null}<TextInput placeholderTextColor="#6F7F8E" style={styles.fieldInput} {...props} />{right}</View>;
}

function PickerField({ value, onValueChange, values }: { value: string; onValueChange: (v: string) => void; values: string[] }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.pickerField} onPress={() => setVisible(true)} activeOpacity={0.84} accessibilityRole="button" accessibilityLabel="Choose state">
        <Text style={styles.pickerValue}>{stateName(value)} ({value})</Text><Text style={styles.pickerChevron}>⌄</Text>
      </TouchableOpacity>
      <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity style={styles.stateSheet} activeOpacity={1}>
            <View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>Choose State</Text>
            <ScrollView style={styles.stateList} showsVerticalScrollIndicator={false}>
              {values.map((v) => <TouchableOpacity key={v} style={[styles.stateOption, value === v && styles.stateOptionActive]} onPress={() => { onValueChange(v); setVisible(false); }}><Text style={[styles.stateOptionText, value === v && styles.stateOptionTextActive]}>{stateName(v)}</Text><Text style={styles.stateCode}>{v}</Text></TouchableOpacity>)}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function Label({ text }: { text: string }) { return <Text style={styles.fieldLabel}>{text}</Text>; }

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity style={[styles.segment, active && styles.segmentActive]} onPress={onPress} accessibilityRole="button"><Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>{label}</Text></TouchableOpacity>;
}

function DetailTabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity style={[styles.detailTabButton, active && styles.detailTabButtonActive]} onPress={onPress}><Text style={[styles.detailTab, active && styles.detailTabActive]} numberOfLines={1}>{label}</Text></TouchableOpacity>;
}

function Pill({ label, tone }: { label: string; tone: 'green' | 'red' | 'amber' | 'gray' }) {
  const colors = tone === 'green' ? [APP_GREEN_SOFT, APP_GREEN] : tone === 'red' ? [APP_RED_SOFT, APP_RED] : tone === 'amber' ? ['#302711', '#FFBF5F'] : [APP_CARD_ALT, APP_MUTED];
  return <View style={[styles.pill, { backgroundColor: colors[0] }]}><Text style={[styles.pillText, { color: colors[1] }]}>{label}</Text></View>;
}

function DashboardMetricCard({ iconSource, label, value, tone, helper }: { iconSource: number; label: string; value: string; tone: 'red' | 'green' | 'blue'; helper?: string }) {
  const fg = tone === 'red' ? APP_RED : tone === 'green' ? APP_GREEN : APP_BLUE;
  const bg = tone === 'red' ? APP_RED_SOFT : tone === 'green' ? APP_GREEN_SOFT : APP_BLUE_SOFT;
  return (
    <View style={styles.dashboardMetricCard}>
      <View style={[styles.dashboardMetricIcon, { backgroundColor: bg }]}><IconImage source={iconSource} size={17} tint={fg} /></View>
      <Text style={[styles.dashboardMetricValue, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.dashboardMetricLabel} numberOfLines={1}>{label}</Text>
      {helper ? <Text style={styles.dashboardMetricHelper} numberOfLines={1}>{helper}</Text> : null}
    </View>
  );
}

function StatCard({ iconSource, value, label, tone }: { iconSource: number; value: string; label: string; tone: 'green' | 'red' }) {
  const bg = tone === 'red' ? RED_SOFT : '#EFFFDF';
  const fg = tone === 'red' ? RED : GREEN_DARK;
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: bg }]}><IconImage source={iconSource} size={18} tint={fg} /></View><Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text><Text style={styles.statLabel} numberOfLines={2}>{label}</Text></View>;
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{action ? <TouchableOpacity onPress={onAction} hitSlop={8}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity> : null}</View>;
}

function InfoTile({ iconSource, label, value }: { iconSource: number; label: string; value: string }) {
  return <View style={styles.infoTile}><View style={styles.infoTileIcon}><IconImage source={iconSource} size={17} tint={APP_TEXT} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue} numberOfLines={1}>{value}</Text></View></View>;
}

function InfoRow({ iconSource, label, value, trailing, accent, helper, onTrailingPress }: { iconSource: number; label: string; value: string; trailing?: 'copy'; accent?: boolean; helper?: string; onTrailingPress?: () => void }) {
  return <View style={styles.infoRow}><View style={styles.infoRowIconWrap}><IconImage source={iconSource} size={19} tint={APP_TEXT} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.infoLabel}>{label}</Text><Text style={[styles.infoValue, accent && { color: APP_GREEN }]} numberOfLines={1}>{value}</Text>{helper ? <Text style={styles.infoHelper}>{helper}</Text> : null}</View>{trailing === 'copy' && onTrailingPress ? <TouchableOpacity style={styles.copyMiniButton} onPress={onTrailingPress} accessibilityLabel="Copy VIN"><IconImage source={ICON_COPY_DETAIL} size={17} tint={APP_TEXT} /></TouchableOpacity> : null}</View>;
}

function DetailLine({ iconSource, label, value, sub }: { iconSource: number; label: string; value: string; sub?: string }) {
  return <View style={styles.detailLine}><View style={styles.detailLineIconWrap}><IconImage source={iconSource} size={17} tint={APP_TEXT} /></View><Text style={styles.detailLineLabel}>{label}</Text><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.detailLineValue}>{value || '—'}</Text>{sub ? <Text style={styles.detailLineSub}>{sub}</Text> : null}</View></View>;
}

function EmptyCard({ icon, iconSource, title, body, button, onPress }: { icon?: string; iconSource?: number; title: string; body: string; button?: string; onPress?: () => void }) {
  return <View style={styles.emptyCard}><View style={styles.emptyIcon}>{iconSource ? <IconImage source={iconSource} size={21} tint={APP_GREEN} /> : <Text style={styles.emptyIconText}>{icon || '✓'}</Text>}</View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>{button && onPress ? <TouchableOpacity style={styles.emptyAction} onPress={onPress}><Text style={styles.sectionAction}>{button}</Text><IconImage source={ICON_ARROW} size={14} tint={GREEN_DARK} /></TouchableOpacity> : null}</View>;
}

function BottomNav({ active, onTab }: { active: MainTab; onTab: (tab: MainTab) => void }) {
  return <View style={styles.bottomNavWrap}><View style={styles.bottomNav}><NavItem iconSource={ICON_HOME} label="Home" active={active === 'home'} onPress={() => onTab('home')} /><NavItem iconSource={ICON_VEHICLES} label="Vehicles" active={active === 'vehicles'} onPress={() => onTab('vehicles')} /><NavItem iconSource={ICON_FINES} label="Fines" active={active === 'fines'} onPress={() => onTab('fines')} /><NavItem iconSource={ICON_MORE} label="More" active={active === 'more'} onPress={() => onTab('more')} /></View></View>;
}

function NavItem({ iconSource, label, active, onPress }: { iconSource: number; label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity style={styles.navItem} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}><View style={[styles.navIconWrap, active && styles.navIconActive]}><IconImage source={iconSource} size={19} tint={active ? INK : '#677067'} /></View><Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text></TouchableOpacity>;
}

function IconImage({ source, size, tint, style }: { source: number; size: number; tint?: string; style?: object }) {
  return <Image source={source} resizeMode="contain" style={[{ width: size, height: size, tintColor: tint }, style]} />;
}

function Chevron({ size = 15, tint = APP_MUTED }: { size?: number; tint?: string }) {
  return <IconImage source={ICON_ARROW} size={size} tint={tint} />;
}

function OfferCard({ offer, onPress }: { offer: Offer; onPress: () => void }) {
  return <TouchableOpacity style={styles.offerCard} onPress={onPress} activeOpacity={0.88} accessibilityRole="button" accessibilityLabel={offer.title}><Image source={offer.image} style={styles.offerCardImage} resizeMode="cover" /></TouchableOpacity>;
}

function MiniFeature({ iconSource, label }: { iconSource: number; label: string }) {
  return <View style={styles.miniFeature}><View style={styles.miniFeatureIcon}><IconImage source={iconSource} size={18} tint="#fff" /></View><Text style={styles.miniFeatureText}>{label}</Text></View>;
}

function RecentLookup({ plate, state, onPress }: { plate: string; state: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.recentRow} onPress={onPress} activeOpacity={0.84}><View style={styles.recentIcon}><IconImage source={ICON_SEARCH} size={17} tint={INK} /></View><View style={{ flex: 1 }}><Text style={styles.previewLabel}>{plate}</Text><Text style={styles.previewSub}>{state}</Text></View><Chevron /></TouchableOpacity>;
}

function TrustLine({ iconSource, title, body }: { iconSource: number; title: string; body: string }) {
  return <View style={styles.trustLine}><View style={styles.trustIconWrap}><IconImage source={iconSource} size={17} tint={INK} /></View><View style={{ flex: 1 }}><Text style={styles.trustTitle}>{title}</Text><Text style={styles.trustBody}>{body}</Text></View></View>;
}

function VehicleIconSelector({ value, onChange }: { value: VehicleIconKey; onChange: (value: VehicleIconKey) => void }) {
  return <View style={styles.vehicleIconSelector}>{VEHICLE_ICON_OPTIONS.map((item) => <TouchableOpacity key={item.key} style={[styles.vehicleIconChoice, value === item.key && styles.vehicleIconChoiceActive]} onPress={() => onChange(item.key)} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ selected: value === item.key }} accessibilityLabel={item.label}><Image source={VEHICLE_ICON_ASSETS[item.key]} style={styles.vehicleIconChoiceImage} resizeMode="contain" /></TouchableOpacity>)}</View>;
}

function AvatarPicker({ selected, onChange }: { selected: number; onChange: (index: number) => void }) {
  return <View style={styles.avatarGrid}>{AVATAR_ASSETS.map((source, index) => <TouchableOpacity key={index} onPress={() => onChange(index)} style={[styles.avatarChoice, selected === index && styles.avatarChoiceActive]} activeOpacity={0.82} accessibilityRole="button" accessibilityState={{ selected: selected === index }} accessibilityLabel={`Avatar ${index + 1}`}><Image source={source} style={styles.avatarChoiceImage} resizeMode="cover" />{selected === index ? <View style={styles.avatarCheck}><Text style={styles.avatarCheckText}>✓</Text></View> : null}</TouchableOpacity>)}</View>;
}

function ProfileCard({ session, onPress, avatarSource }: { session: Session; onPress?: () => void; avatarSource?: number }) {
  const initials = (session.user.full_name || session.user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
  return <TouchableOpacity style={styles.profileCard} onPress={onPress} disabled={!onPress} activeOpacity={0.85}>{avatarSource ? <Image source={avatarSource} style={styles.profileAvatarImage} resizeMode="cover" /> : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>}<View style={{ flex: 1, minWidth: 0 }}><Text style={styles.profileName}>{session.user.full_name || 'Tixradar Driver'}</Text><Text style={styles.profileEmail} numberOfLines={1}>{session.user.email}</Text></View>{onPress ? <Chevron /> : null}</TouchableOpacity>;
}

function MenuRow({ iconSource, title, subtitle, onPress }: { iconSource: number; title: string; subtitle: string; onPress?: () => void }) {
  return <TouchableOpacity style={styles.menuRow} onPress={onPress} disabled={!onPress} activeOpacity={0.84}><View style={styles.menuIconWrap}><IconImage source={iconSource} size={18} tint={APP_TEXT} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSub}>{subtitle}</Text></View>{onPress ? <Chevron /> : null}</TouchableOpacity>;
}

function ToggleRow({ iconSource, title, subtitle, value, onValueChange }: { iconSource: number; title: string; subtitle: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return <View style={styles.menuRow}><View style={styles.menuIconWrap}><IconImage source={iconSource} size={18} tint={APP_TEXT} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSub}>{subtitle}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#2C3A47', true: APP_BLUE }} thumbColor="#FFFFFF" /></View>;
}

function ActionSheetRow({ iconSource, title, subtitle, onPress, destructive }: { iconSource: number; title: string; subtitle: string; onPress: () => void; destructive?: boolean }) {
  return <TouchableOpacity style={styles.actionSheetRow} onPress={onPress} activeOpacity={0.84}><View style={[styles.actionSheetIcon, destructive && styles.actionSheetIconDanger]}><IconImage source={iconSource} size={19} tint={destructive ? APP_RED : APP_TEXT} /></View><View style={{ flex: 1 }}><Text style={[styles.actionSheetTitle, destructive && { color: APP_RED }]}>{title}</Text><Text style={styles.actionSheetSub}>{subtitle}</Text></View><Chevron tint={destructive ? APP_RED : APP_MUTED} /></TouchableOpacity>;
}

function CenteredState({ title, body, onBack }: { title: string; body: string; onBack: () => void }) {
  return <View style={styles.centeredState}><View style={styles.emptyIcon}><IconImage source={ICON_WARNING} size={21} tint={GREEN_DARK} /></View><Text style={styles.successTitle}>{title}</Text><Text style={styles.successSub}>{body}</Text><PrimaryButton title="Go Back" onPress={onBack} /></View>;
}

// ---------- Helpers ----------

function normalizeVehicleIcon(value?: string | null): VehicleIconKey {
  return VEHICLE_ICON_OPTIONS.some((item) => item.key === value) ? value as VehicleIconKey : 'sedan';
}
function carImageForCar(car: Pick<CarSummary, 'vehicle_icon'>) { return VEHICLE_ICON_ASSETS[normalizeVehicleIcon(car.vehicle_icon)]; }

function flattenViolations(details: Record<number, CarDetailResponse>) {
  return Object.values(details).flatMap((detail) => detail.violations.map((stored) => ({ car: detail.car, violation: stored.data })));
}
function carOpenCount(detail?: CarDetailResponse) { return detail?.violations.filter((v) => toMoney(v.amount_due) > 0).length ?? 0; }
function toMoney(value: string | number | null | undefined) { const n = Number.parseFloat(String(value ?? '0')); return Number.isFinite(n) ? n : 0; }
function registrationFlags(reg?: Registration) { if (!reg) return []; return ['scofflaw_indicator', 'suspension_indicator', 'revocation_indicator'].filter((key) => (reg as unknown as Record<string, string | undefined>)[key] === 'Y'); }
function vehicleDisplayName(detail: CarDetailResponse) { const r = detail.registration?.data; const generated = [r?.model_year, r?.make].filter(Boolean).join(' '); return generated || detail.car.nickname; }
function formatDate(value?: string | null) { if (!value) return 'Not available'; const date = new Date(value); if (Number.isNaN(date.getTime())) return value.slice(0, 10); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatIssueDate(value?: string | null) { if (!value) return 'Date unavailable'; const parts = value.split('/'); if (parts.length === 3) { const [m, d, y] = parts; const date = new Date(Number(y), Number(m) - 1, Number(d)); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } return formatDate(value); }
function relativeExpiry(value: string) { const date = new Date(value); const months = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)); return months >= 0 ? `in about ${months} month${months === 1 ? '' : 's'}` : 'expired'; }
function stateName(code: string) { return STATE_NAMES[code?.toUpperCase()] || code; }
function normalizeVin(value: string) { return value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17); }
function isValidVin(value: string) { return /^[A-HJ-NPR-Z0-9]{17}$/.test(value); }
function profileInitials(session: Session) {
  const base = session.user.full_name?.trim() || session.user.email.split('@')[0] || 'Driver';
  const parts = base.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || 'D') + (parts[1]?.[0] || '')).toUpperCase().slice(0, 2);
}
function formatCompactMoney(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function greetingForTime() { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }
async function copyText(value: string, message = 'Copied') { await Clipboard.setStringAsync(value); Alert.alert(message); }
function friendlyViolation(value?: string) { if (!value) return 'Parking Violation'; const text = value.toLowerCase(); if (text.includes('camera')) return 'Speed Camera'; if (text.includes('bus')) return 'Bus Lane Violation'; if (text.includes('no standing')) return 'No Standing'; if (text.includes('parking')) return value.replace(/\b\w/g, (c) => c.toUpperCase()); return value.replace(/[-_]/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }
function violationLocation(v: Violation) { return [v.house_number, v.street_name].filter(Boolean).join(' & ') || 'New York City'; }
function timeAgo(value: string) { const ms = Date.now() - new Date(value).getTime(); const mins = Math.max(1, Math.round(ms / 60000)); if (mins < 60) return `${mins}m ago`; const hours = Math.round(mins / 60); if (hours < 24) return `${hours}h ago`; return `${Math.round(hours / 24)}d ago`; }
function getErrorMessage(err: unknown) { return err instanceof Error ? err.message : 'Something went wrong. Please try again.'; }
async function copySummons(value: string) { await Clipboard.setStringAsync(value); Alert.alert('Copied', `Summons #${value} copied to your clipboard.`); }

// ---------- Styles ----------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_BG, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  screenFlex: { flex: 1, backgroundColor: APP_BG },
  appScroll: { flex: 1, backgroundColor: APP_BG },
  appScrollContent: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 36 },
  launch: { flex: 1, backgroundColor: '#101611', alignItems: 'center', justifyContent: 'center', padding: 32 },
  launchIcon: { width: 84, height: 84, borderRadius: 22, marginBottom: 18 },
  launchTag: { fontSize: 11, color: '#AEB7AF', letterSpacing: 2.3, marginTop: 12, textAlign: 'center' },

  welcomePage: { flex: 1, backgroundColor: APP_BG },
  welcomeContent: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 28, paddingBottom: 18 },
  welcomeBrandRow: { marginBottom: 26 },
  welcomeEyebrow: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: APP_BLUE_SOFT, borderWidth: 1, borderColor: '#224867' },
  welcomeEyebrowText: { color: '#8EC7FF', fontSize: 9, letterSpacing: 1.45, fontWeight: '900' },
  welcomeTitle: { color: APP_TEXT, fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.7, marginTop: 18, maxWidth: 430 },
  welcomeSubtitle: { color: APP_MUTED, fontSize: 15, lineHeight: 22, marginTop: 11, maxWidth: 430 },
  welcomeHeroCard: { minHeight: 276, borderRadius: 30, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, marginTop: 26, padding: 18, overflow: 'hidden' },
  welcomeHeroGlow: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#0E3150', opacity: 0.56, right: -92, top: -82 },
  welcomeHeroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 2 },
  welcomeHeroLabel: { color: APP_MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  welcomeHeroHeading: { color: APP_TEXT, fontSize: 18, fontWeight: '900', marginTop: 5, letterSpacing: -0.5 },
  welcomeLivePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: APP_GREEN_SOFT, paddingHorizontal: 9, paddingVertical: 6 },
  welcomeLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: APP_GREEN },
  welcomeLiveText: { color: APP_GREEN, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  welcomeCar: { width: '78%', height: 116, alignSelf: 'center', marginTop: 6, marginBottom: 5 },
  welcomeAlertCard: { minHeight: 66, borderRadius: 19, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  welcomeAlertIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: APP_BLUE_SOFT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  welcomeAlertTitle: { color: APP_TEXT, fontSize: 12.5, fontWeight: '900' },
  welcomeAlertSub: { color: APP_MUTED, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  welcomeFeatureRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  welcomeFeature: { flex: 1, minHeight: 76, borderRadius: 18, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  welcomeFeatureIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: APP_CARD_ALT, alignItems: 'center', justifyContent: 'center' },
  welcomeFeatureText: { color: APP_MUTED, fontSize: 9.5, fontWeight: '800', marginTop: 7 },
  welcomeActions: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 18, paddingTop: 2, backgroundColor: APP_BG },
  welcomeSecondary: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: APP_BORDER, backgroundColor: APP_CARD, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  welcomeSecondaryText: { color: APP_TEXT, fontSize: 14, fontWeight: '900' },
  welcomeTextButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  welcomeTextButtonText: { color: APP_MUTED, fontSize: 12, fontWeight: '700' },
  welcomeLegal: { color: '#627281', fontSize: 9.5, lineHeight: 14, textAlign: 'center', marginTop: 12, paddingHorizontal: 14 },

  brand: { flexDirection: 'row', alignItems: 'center' },
  brandWordmark: { width: 205, height: 34 },
  brandWordmarkCompact: { width: 132, height: 22 },

  onboardingSplash: { flex: 1, backgroundColor: '#0D120E' },
  splashHero: { flex: 1, minHeight: 460, justifyContent: 'flex-start' },
  splashHeroImage: { resizeMode: 'cover' },
  splashShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,8,5,0.32)' },
  splashBrandWrap: { alignItems: 'center', paddingTop: 64 },
  splashMicro: { color: '#D7DDD7', fontSize: 10, letterSpacing: 2.2, marginTop: 8 },
  splashBottom: { backgroundColor: '#0D120E', paddingHorizontal: 22, paddingBottom: 24, paddingTop: 20 },
  splashTitle: { color: '#FFFFFF', fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -1.2, width: '84%', marginBottom: 20 },
  splashFooter: { color: '#A5ADA6', textAlign: 'center', fontSize: 9, letterSpacing: 2.3, marginTop: 12 },
  featureRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  miniFeature: { flex: 1, alignItems: 'center' },
  miniFeatureIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' },
  miniFeatureGlyph: { color: '#fff', fontSize: 18, fontWeight: '800' },
  miniFeatureText: { color: '#DDE2DE', fontSize: 10, marginTop: 6, textAlign: 'center' },

  onboardingPage: { flex: 1, backgroundColor: '#FFFFFF' },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 22, paddingVertical: 14, zIndex: 2 },
  skipText: { color: MUTED, fontSize: 14, fontWeight: '600' },
  onboardingContent: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 22, paddingBottom: 10 },
  onboardingTitle: { fontSize: 34, lineHeight: 38, color: INK, fontWeight: '900', letterSpacing: -1.5 },
  onboardingAccent: { fontSize: 34, lineHeight: 38, color: GREEN_DARK, fontWeight: '900', letterSpacing: -1.5 },
  onboardingSubtitle: { color: MUTED, fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 340 },
  onboardingVisual: { minHeight: 390, marginTop: 28, alignItems: 'center', justifyContent: 'center' },
  onboardingBottom: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D7DBD5' },
  dotActive: { width: 22, backgroundColor: GREEN_DARK },
  fineIllustration: { width: '100%', minHeight: 340, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9F6', borderRadius: 30, overflow: 'hidden' },
  mapGrid: { position: 'absolute', width: 330, height: 220, borderRadius: 40, backgroundColor: '#EFF2EE', transform: [{ rotate: '-8deg' }] },
  fineCardLarge: { width: 245, borderRadius: 28, backgroundColor: '#fff', padding: 22, transform: [{ rotate: '-7deg' }], shadowColor: '#8B938B', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 4 },
  iconBubble: { width: 46, height: 46, borderRadius: 23, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconBubbleText: { color: INK, fontWeight: '900', fontSize: 18 },
  smallCaps: { fontSize: 10, color: MUTED, letterSpacing: 1.4, fontWeight: '800' },
  fineAmount: { fontSize: 31, fontWeight: '900', color: INK, marginTop: 18 },
  fineMeta: { fontSize: 12, color: MUTED, marginTop: 4 },
  handNote: { alignSelf: 'flex-start', marginTop: 16, marginLeft: 26, fontSize: 15, lineHeight: 18, color: INK, fontStyle: 'italic', transform: [{ rotate: '-5deg' }] },
  vehiclePreview: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, backgroundColor: '#F3F5F2', borderWidth: 1, borderColor: BORDER, padding: 10 },
  vehiclePreviewActive: { backgroundColor: '#F7FFF0', borderColor: GREEN_DARK },
  vehiclePreviewImage: { width: 78, height: 54, borderRadius: 12, marginRight: 10 },
  previewLabel: { color: INK, fontSize: 13, fontWeight: '800' },
  previewSub: { color: MUTED, fontSize: 11, lineHeight: 15, marginTop: 2 },
  registrationPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER },
  notificationPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 13 },
  notificationIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notificationTime: { color: '#9AA09A', fontSize: 10 },

  authPage: { flex: 1, backgroundColor: APP_BG },
  authContent: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 40, paddingBottom: 34 },
  authBackButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  authModeSwitch: { flexDirection: 'row', borderRadius: 17, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, padding: 4, marginTop: 28, marginBottom: 26 },
  authModeOption: { flex: 1, minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  authModeOptionActive: { backgroundColor: APP_CARD_ALT },
  authModeText: { color: APP_MUTED, fontSize: 12, fontWeight: '800' },
  authModeTextActive: { color: APP_TEXT },
  socialAuthButton: { minHeight: 56, borderRadius: 18, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 16 },
  socialAuthText: { color: APP_TEXT, fontSize: 13.5, fontWeight: '900', marginLeft: 10 },
  appleMark: { color: APP_TEXT, fontSize: 23, lineHeight: 24, width: 24, textAlign: 'center' },
  googleMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  googleMarkText: { color: '#4285F4', fontSize: 13, fontWeight: '900' },
  authDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
  authDividerLine: { height: 1, flex: 1, backgroundColor: APP_BORDER },
  authDividerText: { color: '#667786', fontSize: 10.5 },
  backTop: { width: 38, height: 38, justifyContent: 'center', marginBottom: 8 },
  backTopText: { fontSize: 36, color: INK },
  authTitle: { color: APP_TEXT, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2 },
  authSubtitle: { color: APP_MUTED, fontSize: 15, lineHeight: 21, marginTop: 7, marginBottom: 22 },
  fieldWrap: { minHeight: 58, borderRadius: 17, borderWidth: 1, borderColor: APP_BORDER, backgroundColor: APP_CARD, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 12 },
  fieldIcon: { width: 28, color: INK, fontSize: 15 },
  fieldInput: { flex: 1, color: APP_TEXT, fontSize: 15, paddingVertical: 15 },
  eyeText: { color: APP_MUTED, fontWeight: '700', fontSize: 12 },
  passwordRules: { gap: 8, marginVertical: 15 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  ruleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: APP_CARD_ALT, alignItems: 'center', justifyContent: 'center' },
  ruleDotOk: { backgroundColor: APP_BLUE },
  ruleCheck: { color: APP_MUTED, fontSize: 11, fontWeight: '900' },
  ruleCheckOk: { color: '#fff' },
  ruleText: { color: APP_MUTED, fontSize: 12 },
  authOptions: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 },
  keepSigned: { color: APP_MUTED, fontSize: 12 },
  linkText: { color: APP_BLUE, fontWeight: '800' },
  formError: { color: APP_RED, fontSize: 12, lineHeight: 17, marginVertical: 10 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
  orLine: { height: 1, flex: 1, backgroundColor: BORDER },
  orText: { color: '#A0A6A0', fontSize: 11 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: INK, fontWeight: '800', fontSize: 13 },
  demoButton: { alignItems: 'center', padding: 16, marginTop: 8 },
  demoButtonText: { color: APP_MUTED, fontSize: 12, textDecorationLine: 'underline' },
  authSwitch: { alignItems: 'center', marginTop: 20 },
  authSwitchText: { color: APP_MUTED, fontSize: 12 },
  legalText: { color: APP_MUTED, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 18 },

  primaryButton: { minHeight: 58, borderRadius: 19, backgroundColor: APP_BLUE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  primaryButtonDark: { backgroundColor: APP_CARD_ALT },
  primaryButtonText: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  primaryButtonIcon: { color: '#FFFFFF', fontSize: 21, width: 26, fontWeight: '900' },
  primaryArrow: { color: INK, fontSize: 20, fontWeight: '900' },
  secondaryButton: { minHeight: 56, borderRadius: 18, backgroundColor: APP_CARD_ALT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, borderWidth: 1, borderColor: APP_BORDER },
  secondaryText: { flex: 1, textAlign: 'center', color: APP_TEXT, fontSize: 14, fontWeight: '800' },
  secondaryIcon: { width: 26, color: INK, fontSize: 19, fontWeight: '800' },
  buttonImageIcon: { marginLeft: 1 },

  topBrandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  roundIconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  roundIconText: { color: INK, fontSize: 15 },
  pageGreeting: { fontSize: 31, lineHeight: 32, color: INK, fontWeight: '800', letterSpacing: -1.2 },
  pageGreetingStrong: { fontSize: 34, lineHeight: 38, color: INK, fontWeight: '900', letterSpacing: -1.4 },
  pageSub: { color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 0 },
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 22 },
  homeIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  homeAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#213344', borderWidth: 1, borderColor: '#4B6175', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  homeAvatarText: { color: APP_TEXT, fontSize: 15, fontWeight: '900', letterSpacing: 0.4 },
  homeAvatarImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12, borderWidth: 1, borderColor: '#526273' },
  homeHello: { color: APP_TEXT, fontSize: 20, lineHeight: 23, fontWeight: '800', letterSpacing: -0.4 },
  homePrompt: { color: APP_MUTED, fontSize: 12.5, marginTop: 3 },
  homeBell: { width: 46, height: 46, borderRadius: 23, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { minHeight: 116, borderRadius: 26, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
  metricIconLarge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  balanceLabel: { color: APP_MUTED, fontSize: 11.5, fontWeight: '700' },
  balanceValue: { fontSize: 31, lineHeight: 35, fontWeight: '900', letterSpacing: -1.2, marginTop: 2 },
  balanceStatus: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginLeft: 8 },
  balanceStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  balanceStatusText: { fontSize: 9.5, fontWeight: '900' },
  metricRow: { flexDirection: 'row', gap: 12 },
  homeMetricRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  dashboardMetricCard: { flex: 1, minWidth: 0, minHeight: 112, borderRadius: 20, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, padding: 11 },
  dashboardMetricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  dashboardMetricValue: { fontSize: 22, lineHeight: 25, fontWeight: '900', letterSpacing: -0.6 },
  dashboardMetricLabel: { color: APP_TEXT, fontSize: 10.5, fontWeight: '900', marginTop: 5 },
  dashboardMetricHelper: { color: APP_MUTED, fontSize: 8.5, marginTop: 2 },
  offersScroller: { marginHorizontal: -18, marginBottom: 14 },
  offersRow: { paddingHorizontal: 18, paddingRight: 8 },
  offerCard: { width: 248, height: 119, borderRadius: 18, overflow: 'hidden', marginRight: 12, backgroundColor: '#111A35', borderWidth: 1, borderColor: '#E0E4DE' },
  offerCardImage: { width: '100%', height: '100%' },
  statGrid: { flexDirection: 'row', gap: 9, marginVertical: 4 },
  statCard: { flex: 1, minHeight: 112, borderRadius: 19, padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER },
  statIcon: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { color: INK, fontSize: 18, fontWeight: '900' },
  statLabel: { color: MUTED, fontSize: 10, lineHeight: 13, marginTop: 3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: APP_TEXT, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  sectionAction: { color: APP_BLUE, fontSize: 12, fontWeight: '900' },
  loadingCard: { backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 20, padding: 20, flexDirection: 'row', gap: 12, alignItems: 'center' },
  mutedText: { color: APP_MUTED, fontSize: 13 },

  header: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 18 },
  headerTitle: { color: APP_TEXT, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.2 },
  headerSub: { color: APP_MUTED, fontSize: 14, marginTop: 4 },
  addCircle: { width: 43, height: 43, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  addCircleText: { color: INK, fontSize: 27, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  segment: { flex: 1, minHeight: 38, borderRadius: 13, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segmentActive: { backgroundColor: APP_BLUE_SOFT, borderColor: APP_BLUE },
  segmentText: { color: APP_MUTED, fontSize: 11, fontWeight: '700' },
  segmentTextActive: { color: APP_TEXT, fontWeight: '900' },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', minHeight: 118, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 24, padding: 12 },
  vehicleCardImageWrap: { width: 104, height: 76, borderRadius: 16, marginRight: 14, backgroundColor: APP_CARD_ALT, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  vehicleCardImage: { width: 82, height: 54 },
  vehicleCardTitle: { color: APP_TEXT, fontSize: 15.5, fontWeight: '900' },
  vehicleCardPlate: { color: APP_MUTED, fontSize: 12, marginTop: 3 },
  vehicleStatusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  vehicleStatusText: { color: APP_MUTED, fontSize: 9.8 },
  chevron: { color: '#616961', fontSize: 26, fontWeight: '300', marginLeft: 7 },
  addVehicleDashed: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#506273', borderRadius: 22, minHeight: 86, marginTop: 14, marginBottom: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 16, backgroundColor: 'rgba(20,34,48,0.42)' },
  addSmallCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#7D8C99', alignItems: 'center', justifyContent: 'center' },
  addSmallText: { color: APP_TEXT, fontSize: 24, lineHeight: 26 },
  addVehicleTitle: { color: APP_TEXT, fontSize: 14, fontWeight: '900' },
  addVehicleSub: { color: APP_MUTED, fontSize: 11, marginTop: 3 },

  topBackRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  topBackButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(20,34,48,0.55)' },
  topBackGlyph: { color: APP_TEXT, fontSize: 33, lineHeight: 36, fontWeight: '300' },
  topBackCenter: { flex: 1, textAlign: 'center', color: APP_TEXT, fontSize: 16, fontWeight: '900' },
  topBackRight: { width: 42, textAlign: 'right', color: INK, fontSize: 18, fontWeight: '900' },
  vehicleHero: { width: '100%', height: 190, borderRadius: 28, backgroundColor: 'transparent', marginBottom: 0 },
  titleStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vehicleDetailSummary: { minHeight: 126, borderRadius: 24, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  vehicleDetailImageBox: { width: 132, height: 92, borderRadius: 18, backgroundColor: APP_CARD_ALT, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  vehicleDetailImage: { width: 112, height: 64 },
  vehicleDetailMeta: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 4 },
  detailTitle: { color: APP_TEXT, fontSize: 27, fontWeight: '900', letterSpacing: -1 },
  detailPlate: { color: APP_MUTED, fontSize: 19, fontWeight: '700', marginTop: 3, letterSpacing: 0.3 },
  detailTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: APP_BORDER, marginTop: 20, marginBottom: 16 },
  detailTab: { flex: 1, textAlign: 'center', color: APP_MUTED, fontSize: 12, paddingVertical: 13 },
  detailTabActive: { color: APP_TEXT, fontWeight: '900' },
  twoCol: { flexDirection: 'row', gap: 10 },
  infoTile: { flex: 1, minHeight: 88, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { color: INK, fontSize: 16, fontWeight: '900' },
  infoLabel: { color: APP_MUTED, fontSize: 10.5 },
  infoValue: { color: APP_TEXT, fontSize: 13.5, fontWeight: '900', marginTop: 3 },
  infoRow: { minHeight: 78, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  infoRowIcon: { width: 33 },
  infoRowIconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  overviewStack: { gap: 2 },
  infoTrailing: { color: MUTED, fontSize: 16 },
  infoHelper: { color: APP_MUTED, fontSize: 10, marginTop: 3, fontWeight: '700' },

  fineRow: { flexDirection: 'row', alignItems: 'center', minHeight: 94, borderRadius: 20, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, padding: 12 },
  fineTypeIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: SOFT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  fineTypeIconText: { color: INK, fontSize: 16, fontWeight: '900' },
  fineRowTitle: { color: APP_TEXT, fontSize: 13, fontWeight: '900' },
  fineRowMeta: { color: APP_MUTED, fontSize: 10, marginTop: 2 },
  fineRight: { alignItems: 'flex-end', gap: 5 },
  fineRowAmount: { color: APP_TEXT, fontSize: 13, fontWeight: '900' },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
  pillText: { fontSize: 9.5, fontWeight: '900' },

  violationHeaderCard: { backgroundColor: APP_CARD, borderRadius: 22, borderWidth: 1, borderColor: APP_BORDER, padding: 16, marginBottom: 12 },
  violationHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  redIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  redIconText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  violationHeaderTitle: { color: APP_TEXT, fontSize: 15, fontWeight: '900' },
  violationHeaderSub: { color: APP_MUTED, fontSize: 11, marginTop: 2 },
  bigMoney: { color: APP_TEXT, fontSize: 34, fontWeight: '900', marginTop: 18, letterSpacing: -1 },
  detailList: { backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 22, overflow: 'hidden', marginBottom: 10 },
  detailLine: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: APP_BORDER },
  detailLineIcon: { width: 32, color: INK, fontWeight: '900' },
  detailLineLabel: { width: 84, color: APP_MUTED, fontSize: 10.5 },
  detailLineValue: { color: APP_TEXT, fontSize: 12, fontWeight: '800' },
  detailLineSub: { color: APP_MUTED, fontSize: 10, marginTop: 2 },

  offerDetailImage: { width: '100%', height: 168, borderRadius: 22, backgroundColor: '#111A35', marginTop: 4 },
  offerEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  offerDiscount: { color: GREEN_DARK, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  offerDetailTitle: { color: INK, fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -1.1, marginTop: 14 },
  offerDetailSub: { color: MUTED, fontSize: 14, lineHeight: 21, marginTop: 8 },
  offerInfoCard: { backgroundColor: '#F1F3EF', borderRadius: 22, padding: 17, marginTop: 22 },
  offerInfoLabel: { color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' },
  offerInfoValue: { color: INK, fontSize: 14, fontWeight: '900', marginTop: 5 },
  offerInfoDivider: { height: 1, backgroundColor: '#DDE1DA', marginVertical: 15 },
  offerInfoBody: { color: INK, fontSize: 12, lineHeight: 18, marginTop: 5 },
  claimCard: { minHeight: 94, borderRadius: 22, backgroundColor: '#EFFFDF', borderWidth: 1, borderColor: '#CFF7AD', padding: 14, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  claimCheck: { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  claimCheckText: { color: INK, fontSize: 19, fontWeight: '900' },
  claimTitle: { color: INK, fontSize: 13, fontWeight: '900' },
  claimSub: { color: MUTED, fontSize: 10, marginTop: 2 },
  claimCodeButton: { minWidth: 105, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#DCE4D6', paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' },
  claimCode: { color: INK, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  claimCopy: { color: GREEN_DARK, fontSize: 9, fontWeight: '900', marginTop: 2 },
  offerTerms: { color: '#929991', fontSize: 10, lineHeight: 15, marginTop: 13, marginBottom: 18 },

  paymentPage: { flex: 1, backgroundColor: APP_BG, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  paymentCenter: { flex: 1, justifyContent: 'center' },
  externalIconWrap: { width: 84, height: 84, borderRadius: 25, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 28 },
  externalDoc: { color: APP_TEXT, fontSize: 34 },
  externalGreen: { position: 'absolute', right: -6, bottom: -6, width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  externalGreenText: { fontSize: 22, color: INK, fontWeight: '900' },
  paymentTitle: { color: APP_TEXT, fontSize: 32, fontWeight: '900', letterSpacing: -1.2 },
  paymentSub: { color: APP_MUTED, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 22 },
  trustCard: { backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 22, padding: 16, gap: 18 },
  trustLine: { flexDirection: 'row', gap: 12 },
  trustIcon: { width: 26, color: INK, fontSize: 18 },
  trustTitle: { color: APP_TEXT, fontSize: 12, fontWeight: '900' },
  trustBody: { color: APP_MUTED, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  paymentBottom: { paddingBottom: 20 },
  cancelText: { color: APP_MUTED, fontSize: 13, fontWeight: '700', textAlign: 'center', paddingVertical: 14 },

  lookupIcon: { width: 70, height: 70, borderRadius: 22, backgroundColor: '#F2F4F1', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderWidth: 1, borderColor: BORDER, marginTop: 12 },
  lookupIconText: { color: INK, fontSize: 27, fontWeight: '900' },
  lookupTitle: { color: APP_TEXT, fontSize: 30, fontWeight: '900', letterSpacing: -1.1, textAlign: 'center', marginTop: 24 },
  lookupSub: { color: APP_MUTED, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 22, paddingHorizontal: 10 },
  fieldLabel: { color: APP_TEXT, fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 7 },
  pickerField: { minHeight: 58, borderRadius: 17, borderWidth: 1, borderColor: APP_BORDER, backgroundColor: APP_CARD, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerValue: { color: APP_TEXT, fontSize: 15, fontWeight: '700' },
  pickerChevron: { color: APP_MUTED, fontSize: 22, marginTop: -5 },
  stateSheet: { width: '100%', maxWidth: 520, alignSelf: 'center', maxHeight: '78%', backgroundColor: APP_CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 22 },
  stateList: { marginTop: 12 },
  stateOption: { minHeight: 52, borderRadius: 15, paddingHorizontal: 14, marginBottom: 7, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stateOptionActive: { borderColor: APP_BLUE, backgroundColor: APP_BLUE_SOFT },
  stateOptionText: { color: APP_TEXT, fontSize: 13, fontWeight: '800' },
  stateOptionTextActive: { color: '#FFFFFF' },
  stateCode: { color: APP_MUTED, fontSize: 11, fontWeight: '800' },
  recentRow: { minHeight: 66, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  recentClock: { width: 38, color: INK, fontSize: 19 },
  lookupResultHero: { minHeight: 104, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lookupResultCar: { width: 140, height: 90, borderRadius: 16 },
  resultPlate: { color: INK, fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  resultState: { color: MUTED, fontSize: 13, marginTop: 2, marginBottom: 16 },
  lookupInfoCard: { minHeight: 70, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  sourceNote: { color: MUTED, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 20, marginTop: 15 },

  addVehicleIcon: { width: 78, height: 78, borderRadius: 39, backgroundColor: APP_BLUE_SOFT, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 8 },
  addVehicleIconText: { color: APP_TEXT, fontSize: 28, fontWeight: '900' },
  plusBadge: { position: 'absolute', right: -2, bottom: 3, width: 27, height: 27, borderRadius: 14, backgroundColor: APP_BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: APP_BG },
  plusBadgeText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  helperText: { color: APP_MUTED, fontSize: 10.5, lineHeight: 15, marginTop: 5 },
  scanText: { color: APP_TEXT, fontSize: 19, fontWeight: '900' },

  successPage: { flex: 1, backgroundColor: APP_BG, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  successBadge: { width: 86, height: 86, borderRadius: 43, backgroundColor: APP_GREEN_SOFT, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  successCheck: { color: APP_GREEN, fontSize: 41, fontWeight: '900' },
  successTitle: { color: APP_TEXT, fontSize: 30, lineHeight: 34, fontWeight: '900', letterSpacing: -1.2, textAlign: 'center' },
  successSub: { color: APP_MUTED, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 9, paddingHorizontal: 16 },
  successCar: { width: '100%', height: 180, marginVertical: 12 },
  successCarCard: { minHeight: 70, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },

  activityRow: { minHeight: 84, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 19, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { color: APP_TEXT, fontSize: 12.5, fontWeight: '900' },
  activityBody: { color: APP_MUTED, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  activityTime: { color: '#6F8090', fontSize: 9 },

  profileCard: { minHeight: 76, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#213344', borderWidth: 1, borderColor: '#4B6175', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  profileName: { color: APP_TEXT, fontSize: 14, fontWeight: '900' },
  profileEmail: { color: APP_MUTED, fontSize: 10.5, marginTop: 3 },
  menuRow: { minHeight: 72, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  menuIcon: { width: 37, color: INK, fontSize: 17, fontWeight: '900' },
  menuTitle: { color: APP_TEXT, fontSize: 12.5, fontWeight: '900' },
  menuSub: { color: APP_MUTED, fontSize: 10.5, marginTop: 2 },
  signOutRow: { minHeight: 58, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 17, paddingHorizontal: 15, justifyContent: 'center', marginTop: 6 },
  signOutText: { color: APP_RED, fontSize: 13, fontWeight: '800' },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,.68)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: APP_CARD, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 10 },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#4A5966', alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { color: APP_TEXT, fontSize: 24, fontWeight: '900' },
  sheetSub: { color: APP_MUTED, fontSize: 13, marginTop: 4, marginBottom: 18 },

  bottomNav: { width: '100%', maxWidth: 484, height: 72, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 6 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIconWrap: { minWidth: 34, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: GREEN },
  navIcon: { color: '#677067', fontSize: 17, fontWeight: '900' },
  navIconTextActive: { color: INK },
  navLabel: { color: '#858D85', fontSize: 9, marginTop: 2 },
  navLabelActive: { color: GREEN_DARK, fontWeight: '900' },

  emptyCard: { borderRadius: 22, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, padding: 22, alignItems: 'center' },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: APP_GREEN_SOFT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyIconText: { color: GREEN_DARK, fontSize: 21, fontWeight: '900' },
  emptyTitle: { color: APP_TEXT, fontSize: 16, fontWeight: '900' },
  emptyBody: { color: APP_MUTED, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 5, marginBottom: 10 },
  notificationBadgeDot: { position: 'absolute', right: 8, top: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: APP_BLUE, borderWidth: 1.5, borderColor: APP_CARD },
  quickActionsBlock: { marginTop: 4, marginBottom: 4 },
  vehicleFineBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, marginTop: 7 },
  vehicleFineBadgeOpen: { backgroundColor: APP_RED_SOFT },
  vehicleFineBadgeClear: { backgroundColor: APP_GREEN_SOFT },
  vehicleFineBadgeText: { color: APP_GREEN, fontSize: 9.5, fontWeight: '800' },
  vehicleHeroWrap: { minHeight: 196, borderRadius: 28, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  detailTabButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  detailTabButtonActive: { borderBottomColor: APP_BLUE },
  infoTileIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: APP_CARD_ALT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  copyMiniButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center' },
  copyMiniText: { color: APP_TEXT, fontSize: 10.5, fontWeight: '800' },
  documentCard: { backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, borderRadius: 22, padding: 15 },
  documentCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  documentIconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EDFFE1', alignItems: 'center', justifyContent: 'center' },
  documentTitle: { color: APP_TEXT, fontSize: 13, fontWeight: '900' },
  documentSub: { color: APP_MUTED, fontSize: 10.5, marginTop: 2 },
  detailLineIconWrap: { width: 34, height: 34, borderRadius: 11, backgroundColor: APP_CARD_ALT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  vehicleActionSheet: { width: '100%', maxWidth: 540, alignSelf: 'center', backgroundColor: APP_CARD, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 10 },
  actionSheetRow: { minHeight: 72, borderRadius: 18, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  actionSheetIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#1B2B38', alignItems: 'center', justifyContent: 'center' },
  actionSheetIconDanger: { backgroundColor: APP_RED_SOFT },
  actionSheetTitle: { color: APP_TEXT, fontSize: 13, fontWeight: '900' },
  actionSheetSub: { color: APP_MUTED, fontSize: 10.5, marginTop: 2 },
  sheetCancelButton: { minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  sheetCancelText: { color: APP_MUTED, fontSize: 13, fontWeight: '800' },
  deleteWarningIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: APP_RED_SOFT, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  destructiveButton: { minHeight: 56, borderRadius: 18, backgroundColor: APP_RED, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  destructiveButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  fineTypeIconOpen: { backgroundColor: APP_RED_SOFT },
  fineTypeIconPaid: { backgroundColor: APP_GREEN_SOFT },
  fixedScreenInner: { width: '100%', maxWidth: 520, alignSelf: 'center', flex: 1, paddingHorizontal: 22 },
  fixedScreenInnerCenter: { width: '100%', maxWidth: 520, alignSelf: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  lookupInfoIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F1F4EF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  recentIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#F1F4EF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sourceInfoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, backgroundColor: '#F1F4EF', padding: 13, marginTop: 14 },
  sourceNoteInline: { flex: 1, color: MUTED, fontSize: 10.5, lineHeight: 16 },
  vehicleIconSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 },
  vehicleIconChoice: { flex: 1, minWidth: 0, height: 56, borderRadius: 15, borderWidth: 1, borderColor: APP_BORDER, backgroundColor: APP_CARD, alignItems: 'center', justifyContent: 'center' },
  vehicleIconChoiceActive: { borderColor: APP_BLUE, backgroundColor: APP_BLUE_SOFT },
  vehicleIconChoiceImage: { width: '68%', height: 24 },
  copySummonsButton: { minHeight: 58, borderRadius: 18, backgroundColor: 'transparent', borderWidth: 1, borderColor: APP_BORDER, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 12 },
  copySummonsText: { flex: 1, color: APP_TEXT, fontSize: 13.5, fontWeight: '800', marginRight: 12 },
  setupPage: { flex: 1, backgroundColor: APP_BG },
  setupContent: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 32, paddingBottom: 34 },
  setupStepPill: { alignSelf: 'flex-start', backgroundColor: APP_BLUE_SOFT, borderWidth: 1, borderColor: '#224867', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 28 },
  setupStepText: { color: '#8EC7FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  setupTitle: { color: APP_TEXT, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.35, marginTop: 15 },
  setupSubtitle: { color: APP_MUTED, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 22 },
  setupPreview: { minHeight: 90, borderRadius: 22, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 4 },
  setupPreviewAvatar: { width: 60, height: 60, borderRadius: 20, marginRight: 13, borderWidth: 1, borderColor: '#526273' },
  setupPreviewName: { color: APP_TEXT, fontSize: 16, fontWeight: '900' },
  setupPreviewEmail: { color: APP_MUTED, fontSize: 10.5, marginTop: 4 },
  setupHint: { color: APP_MUTED, fontSize: 10.5, lineHeight: 16, marginTop: 7, marginBottom: 4 },
  setupChangeAccount: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  setupChangeAccountText: { color: APP_MUTED, fontSize: 11.5, fontWeight: '700' },
  profileEditPreview: { minHeight: 88, borderRadius: 22, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  profileEditAvatar: { width: 58, height: 58, borderRadius: 20, marginRight: 13, borderWidth: 1, borderColor: '#526273' },
  profileEditName: { color: APP_TEXT, fontSize: 16, fontWeight: '900' },
  profileEditHint: { color: APP_MUTED, fontSize: 11, marginTop: 4 },
  profileFieldHint: { color: APP_MUTED, fontSize: 10.5, lineHeight: 16, marginTop: 7, marginBottom: 3 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  avatarChoice: { width: 66, height: 66, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  avatarChoiceActive: { borderColor: APP_BLUE },
  avatarChoiceImage: { width: '100%', height: '100%', borderRadius: 16 },
  avatarCheck: { position: 'absolute', right: -3, bottom: -3, width: 21, height: 21, borderRadius: 11, backgroundColor: APP_BLUE, borderWidth: 2, borderColor: APP_BG, alignItems: 'center', justifyContent: 'center' },
  avatarCheckText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  profileAvatarImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12, borderWidth: 1, borderColor: '#526273' },
  editVehiclePreview: { height: 154, borderRadius: 24, backgroundColor: APP_CARD, borderWidth: 1, borderColor: APP_BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
  editVehicleImage: { width: '78%', height: 126 },
  editNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 16, backgroundColor: APP_CARD_ALT, borderWidth: 1, borderColor: APP_BORDER, padding: 13, marginTop: 16 },
  editNoticeText: { flex: 1, color: APP_MUTED, fontSize: 10.5, lineHeight: 16 },
  errorBadge: { backgroundColor: RED_SOFT },
  emptyAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 13, backgroundColor: '#F0FFE5' },
  menuIconWrap: { width: 40, height: 40, borderRadius: 13, backgroundColor: APP_CARD_ALT, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  trustIconWrap: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#F1F4EF', alignItems: 'center', justifyContent: 'center' },
  sessionNote: { color: APP_MUTED, fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: 'center' },
  settingsVersion: { color: '#6F8090', fontSize: 10.5, textAlign: 'center', marginTop: 18, marginBottom: 8 },
  bottomNavWrap: { position: 'absolute', left: 0, right: 0, bottom: 8, alignItems: 'center', paddingHorizontal: 18 },
  centeredState: { flex: 1, backgroundColor: APP_BG, justifyContent: 'center', paddingHorizontal: 28 },
});
