import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  Alert,
  useColorScheme,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';

import { LANGUAGES, Lang, translate, translateViolation } from './src/i18n';
import {
  fetchViolations,
  fetchRegistration,
  Violation,
  Registration,
} from './src/api';

const US_STATES = ['NY', 'NJ', 'CT', 'PA', 'FL', 'CA', 'TX'];
const CITYPAY_URL = 'https://a836-citypay.nyc.gov/citypay/Parking';

type Tab = 'plate' | 'vin';

export default function App() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const styles = makeStyles(colors);

  const [lang, setLang] = useState<Lang>('en');
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const [tab, setTab] = useState<Tab>('plate');
  const [plate, setPlate] = useState('');
  const [state, setState] = useState('NY');
  const [vin, setVin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [violationsResult, setViolationsResult] = useState<{ plate: string; state: string; violations: Violation[] } | null>(null);
  const [registrationResult, setRegistrationResult] = useState<{ vin: string; registrations: Registration[] } | null>(null);
  const [showPaid, setShowPaid] = useState(false);

  async function onCheckViolations() {
    if (!plate.trim()) return;
    setLoading(true);
    setError(null);
    setViolationsResult(null);
    setShowPaid(false);
    try {
      const data = await fetchViolations(plate.trim(), state);
      setViolationsResult({ plate: data.plate, state: data.state, violations: data.violations });
    } catch (err: any) {
      setError(t('networkError', { msg: err.message }));
    } finally {
      setLoading(false);
    }
  }

  async function onCheckRegistration() {
    if (!vin.trim()) return;
    setLoading(true);
    setError(null);
    setRegistrationResult(null);
    try {
      const data = await fetchRegistration(vin.trim());
      setRegistrationResult({ vin: data.vin, registrations: data.registrations });
    } catch (err: any) {
      setError(t('networkError', { msg: err.message }));
    } finally {
      setLoading(false);
    }
  }

  async function onPay(summons: string, amount: string) {
    await Clipboard.setStringAsync(summons);
    // No URL parameter exists on CityPay's form to pre-fill the violation number (it's a
    // plain POST-only form with no query-string handling) — copy + hand-off to the system
    // browser is the practical ceiling on mobile, same as the web app's fallback flow.
    Alert.alert('', t('payCopied', { num: summons }), [
      { text: 'OK', onPress: () => Linking.openURL(CITYPAY_URL) },
    ]);
  }

  const outstanding = violationsResult?.violations.filter((v) => (parseFloat(v.amount_due) || 0) > 0) ?? [];
  const paid = violationsResult?.violations.filter((v) => (parseFloat(v.amount_due) || 0) === 0) ?? [];
  const totalDue = outstanding.reduce((sum, v) => sum + (parseFloat(v.amount_due) || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('title')}</Text>
            <Text style={styles.subtitle}>{t('subtitle')}</Text>
          </View>
        </View>

        <View style={styles.pickerWrap}>
          <Picker selectedValue={lang} onValueChange={(v) => setLang(v as Lang)} style={styles.picker}>
            {LANGUAGES.map((l) => (
              <Picker.Item key={l.code} label={l.label} value={l.code} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'plate' && styles.tabBtnActive]}
              onPress={() => setTab('plate')}
            >
              <Text style={[styles.tabBtnText, tab === 'plate' && styles.tabBtnTextActive]}>{t('tabPlate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'vin' && styles.tabBtnActive]}
              onPress={() => setTab('vin')}
            >
              <Text style={[styles.tabBtnText, tab === 'vin' && styles.tabBtnTextActive]}>{t('tabVin')}</Text>
            </TouchableOpacity>
          </View>

          {tab === 'plate' ? (
            <View>
              <Text style={styles.label}>{t('plateLabel')}</Text>
              <TextInput
                style={styles.input}
                value={plate}
                onChangeText={setPlate}
                placeholder="e.g. LXH1203"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                maxLength={10}
              />
              <Text style={styles.label}>{t('stateLabel')}</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={state} onValueChange={setState} style={styles.picker}>
                  {US_STATES.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={onCheckViolations} disabled={loading}>
                <Text style={styles.submitBtnText}>{t('checkViolationsBtn')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>{t('vinLabel')}</Text>
              <TextInput
                style={styles.input}
                value={vin}
                onChangeText={setVin}
                placeholder="e.g. JTDZN3EU6D3199758"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                maxLength={17}
              />
              <TouchableOpacity style={styles.submitBtn} onPress={onCheckRegistration} disabled={loading}>
                <Text style={styles.submitBtnText}>{t('checkRegistrationBtn')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>
              {tab === 'plate' ? t('loadingViolations') : t('loadingRegistration')}
            </Text>
          </View>
        )}

        {error && <Text style={styles.error}>⚠️ {error}</Text>}

        {tab === 'plate' && violationsResult && !loading && (
          violationsResult.violations.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                ✅ {t('noViolations', { plate: violationsResult.plate, state: violationsResult.state })}
              </Text>
              <Text style={styles.note}>{t('noViolationsNote')}</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.summaryText}>
                {t('violationsFound', {
                  count: violationsResult.violations.length,
                  plate: violationsResult.plate,
                  state: violationsResult.state,
                })}
                {'\n'}
                <Text style={{ color: colors.danger, fontWeight: '700' }}>
                  {t('outstandingCount', { count: outstanding.length })}
                </Text>
                {' ('}{t('totalDue', { amount: totalDue.toFixed(2) })}{'), '}
                <Text style={{ color: colors.ok, fontWeight: '700' }}>{t('paidCount', { count: paid.length })}</Text>
              </Text>

              {outstanding.length === 0 ? (
                <Text style={styles.emptyText}>{t('noOutstanding')}</Text>
              ) : (
                outstanding.map((v) => (
                  <ViolationCard key={v.summons_number} v={v} lang={lang} t={t} styles={styles} colors={colors} onPay={onPay} />
                ))
              )}

              {paid.length > 0 && (
                <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowPaid((s) => !s)}>
                  <Text style={styles.tabBtnText}>
                    {showPaid ? t('hidePaid') : t('showPaid', { count: paid.length })}
                  </Text>
                </TouchableOpacity>
              )}
              {showPaid && paid.map((v) => (
                <ViolationCard key={v.summons_number} v={v} lang={lang} t={t} styles={styles} colors={colors} onPay={onPay} />
              ))}
            </View>
          )
        )}

        {tab === 'vin' && registrationResult && !loading && (
          registrationResult.registrations.length === 0 ? (
            <Text style={styles.emptyText}>{t('noRegistration', { vin: registrationResult.vin })}</Text>
          ) : (
            <View>
              <Text style={styles.summaryText}>{t('registrationFor', { vin: registrationResult.vin })}</Text>
              {registrationResult.registrations.map((r, i) => (
                <RegistrationCard key={i} r={r} t={t} styles={styles} colors={colors} />
              ))}
              <Text style={styles.note}>{t('registrationSourceNote')}</Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ViolationCard({ v, lang, t, styles, colors, onPay }: any) {
  const due = parseFloat(v.amount_due) || 0;
  return (
    <View style={styles.resultCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{translateViolation(lang, v.violation)}</Text>
        <View style={[styles.badge, due > 0 ? styles.badgeDanger : styles.badgeOk]}>
          <Text style={due > 0 ? styles.badgeDangerText : styles.badgeOkText}>
            {due > 0 ? t('badgeDue', { amount: v.amount_due }) : t('badgePaid')}
          </Text>
        </View>
      </View>
      <KV label={t('kSummons')} value={v.summons_number} styles={styles} />
      <KV label={t('kIssueDate')} value={`${v.issue_date} ${v.violation_time || ''}`} styles={styles} />
      <KV label={t('kFine')} value={`$${v.fine_amount || '0'}`} styles={styles} />
      <KV label={t('kPenalty')} value={`$${v.penalty_amount || '0'}`} styles={styles} />
      <KV label={t('kInterest')} value={`$${v.interest_amount || '0'}`} styles={styles} />
      <KV label={t('kReduction')} value={`$${v.reduction_amount || '0'}`} styles={styles} />
      <KV label={t('kPaid')} value={`$${v.payment_amount || '0'}`} styles={styles} />
      <KV label={t('kAmountDue')} value={`$${v.amount_due || '0'}`} bold styles={styles} />
      <KV label={t('kStatus')} value={v.violation_status || '—'} styles={styles} />
      <KV label={t('kPrecinct')} value={v.precinct || '—'} styles={styles} />
      <KV label={t('kCounty')} value={v.county || '—'} styles={styles} />
      <KV label={t('kAgency')} value={v.issuing_agency || '—'} styles={styles} />
      {due > 0 && (
        <TouchableOpacity style={styles.payBtn} onPress={() => onPay(v.summons_number, v.amount_due)}>
          <Text style={styles.payBtnText}>{t('payBtn', { amount: v.amount_due })}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function RegistrationCard({ r, t, styles }: any) {
  const flags = ['scofflaw_indicator', 'suspension_indicator', 'revocation_indicator'].filter(
    (k) => (r as any)[k] === 'Y'
  );
  return (
    <View style={styles.resultCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{r.model_year} {r.make} {r.body_type}</Text>
        <View style={[styles.badge, flags.length ? styles.badgeDanger : styles.badgeOk]}>
          <Text style={flags.length ? styles.badgeDangerText : styles.badgeOkText}>
            {flags.length ? flags.join(', ').toUpperCase() : t('badgeClear')}
          </Text>
        </View>
      </View>
      <KV label={t('kColor')} value={r.color || '—'} styles={styles} />
      <KV label={t('kClass')} value={r.registration_class} styles={styles} />
      <KV label={t('kLocation')} value={`${r.city}, ${r.state} ${r.zip} (${r.county})`} styles={styles} />
      <KV label={t('kValidFrom')} value={(r.reg_valid_date || '').slice(0, 10)} styles={styles} />
      <KV label={t('kExpires')} value={(r.reg_expiration_date || '').slice(0, 10)} styles={styles} />
    </View>
  );
}

function KV({ label, value, bold, styles }: { label: string; value: string; bold?: boolean; styles: any }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>{label}</Text>
      <Text style={[styles.kvValue, bold && { fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

const lightColors = {
  bg: '#f5f6f8', card: '#ffffff', text: '#1a1d21', muted: '#6b7280',
  border: '#e2e4e8', accent: '#2563eb', accentText: '#ffffff', danger: '#b91c1c', ok: '#15803d',
};
const darkColors = {
  bg: '#16181c', card: '#1f2227', text: '#e8e9eb', muted: '#9aa0aa',
  border: '#30343b', accent: '#3b82f6', accentText: '#0b0d10', danger: '#f87171', ok: '#4ade80',
};

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    scrollContent: { padding: 16, paddingBottom: 48 },
    headerRow: { flexDirection: 'row', marginBottom: 8 },
    title: { fontSize: 20, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 13, color: c.muted, marginTop: 2 },
    pickerWrap: {
      borderWidth: 1, borderColor: c.border, borderRadius: 8, backgroundColor: c.card,
      marginBottom: 12, overflow: 'hidden',
    },
    picker: { color: c.text },
    card: { backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 16 },
    tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    tabBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    tabBtnActive: { backgroundColor: c.accent, borderColor: c.accent },
    tabBtnText: { color: c.text, fontSize: 13, fontWeight: '600' },
    tabBtnTextActive: { color: c.accentText },
    label: { fontSize: 12, color: c.muted, marginBottom: 4, marginTop: 8 },
    input: {
      borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, fontSize: 15,
      color: c.text, backgroundColor: c.bg,
    },
    submitBtn: { backgroundColor: c.accent, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
    submitBtnText: { color: c.accentText, fontWeight: '700', fontSize: 15 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    loadingText: { color: c.muted },
    error: { color: c.danger, marginBottom: 12 },
    empty: { paddingVertical: 8 },
    emptyText: { color: c.muted, fontSize: 14, marginBottom: 8 },
    note: { fontSize: 12, color: c.muted, lineHeight: 17 },
    summaryText: { fontSize: 13, color: c.muted, marginBottom: 10, lineHeight: 19 },
    resultCard: { backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: c.text, flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    badgeOk: { backgroundColor: 'rgba(21,128,61,0.15)' },
    badgeDanger: { backgroundColor: 'rgba(185,28,28,0.15)' },
    badgeOkText: { color: c.ok, fontSize: 11, fontWeight: '700' },
    badgeDangerText: { color: c.danger, fontSize: 11, fontWeight: '700' },
    kvRow: { flexDirection: 'row', marginBottom: 3 },
    kvKey: { width: 110, color: c.muted, fontSize: 12.5 },
    kvValue: { flex: 1, color: c.text, fontSize: 12.5 },
    payBtn: { backgroundColor: c.danger, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
    payBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    toggleBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, alignItems: 'center', marginVertical: 8 },
  });
}
