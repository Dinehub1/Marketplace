/**
 * Résumé Builder — one form in, one ATS-readable PDF out.
 *
 * Why the PDF is plain, and stays plain. A CV is read by screening software before a person
 * ever opens it, and that software reads one column of selectable text: tables, multi-column
 * layouts, icons and text inside images are the things it silently drops. So this screen
 * offers no template picker and no colour — not because design was skipped, but because a
 * designed CV that no parser can read is a CV nobody reads. The screen says so in words
 * rather than leaving the person to wonder why it looks like 1998.
 *
 * What the engine does, and does not do. `services/tools/worker.py`'s `resume_builder`
 * renders the PDF from `services/tools/resume_layout.py`, which holds every page rule
 * (wrapping, where the breaks fall, never stranding a heading) and imports nothing — so the
 * rules are asserted by `scripts/check-resume.py` on any machine, with no PDF library. It
 * does not rewrite, embellish or invent: every line on the page comes from a field here, and
 * the "nothing is invented" promise is the product, not a disclaimer.
 *
 * The warnings are the engine's own, passed through. The layout knows exactly why it is
 * unhappy (no email, no experience, a bullet that has become a paragraph) and returns those
 * sentences; this screen prints them verbatim rather than re-deriving its own advice, because
 * a screen that guesses eventually guesses wrong.
 */
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { canDownloadFile, openResult, runJob, type JobResult } from "@/lib/tools";
import { useProductUI, type ProductUI } from "@/lib/product-ui";

type Experience = {
  id: number;
  role: string;
  org: string;
  from: string;
  to: string;
  /** One bullet per line. Blank lines are dropped; empty text is not a bullet. */
  bullets: string;
};

type Education = {
  id: number;
  course: string;
  org: string;
  from: string;
  to: string;
  note: string;
};

/** The engine's own meta, as `resume_builder` returns it. */
type ResumeMeta = {
  pages?: number;
  blocks?: number;
  experience?: number;
  education?: number;
  warnings?: string[];
  ms?: number;
};

function bulletsOf(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export default function ResumeBuilder() {
  const ui = useProductUI("resume-builder");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const nextId = useRef(2);

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState<Experience[]>([
    { id: 1, role: "", org: "", from: "", to: "", bullets: "" },
  ]);
  const [education, setEducation] = useState<Education[]>([]);

  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = (job?.meta ?? null) as ResumeMeta | null;
  const warnings = Array.isArray(meta?.warnings) ? meta!.warnings! : [];
  const outputUrl = job?.outputUrl ?? null;

  const filledExperience = experience.filter(
    (e) => e.role.trim() || e.org.trim() || bulletsOf(e.bullets).length,
  );
  const filledEducation = education.filter((e) => e.course.trim() || e.org.trim());

  /**
   * The same two rules the engine enforces, checked here so the button is never enabled for
   * a request the route will answer 400 to. The engine remains the authority — this is the
   * screen agreeing with it, not replacing it.
   */
  const missing = !name.trim()
    ? "Your name is required — a CV with no name on it is not a CV."
    : !(
          summary.trim() ||
          skills.trim() ||
          filledExperience.length ||
          filledEducation.length
        )
      ? "Add at least one of: a summary, a skill, a job or a course."
      : null;

  function payload() {
    return {
      name: name.trim(),
      headline: headline.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      summary: summary.trim(),
      skills: skills.trim(),
      experience: filledExperience.map((e) => ({
        role: e.role.trim(),
        org: e.org.trim(),
        from: e.from.trim(),
        to: e.to.trim(),
        bullets: bulletsOf(e.bullets),
      })),
      education: filledEducation.map((e) => ({
        course: e.course.trim(),
        org: e.org.trim(),
        from: e.from.trim(),
        to: e.to.trim(),
        note: e.note.trim(),
      })),
    };
  }

  async function makePdf() {
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({
        product: "resume-builder",
        fields: { payload: JSON.stringify(payload()) },
      });
      setJob(result);
    } catch (e) {
      // The route's own sentence when it has one (a 400 from the engine is written to be
      // read), a plain fallback when the network is what failed.
      setError(e instanceof Error ? e.message : "Could not reach the engine. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const fileName = name.trim()
    ? `${name.trim().replace(/\s+/g, "-").toLowerCase()}-cv.pdf`
    : "resume.pdf";

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.badgeRow}>
        <Text style={s.badge}>CV · PDF</Text>
        <Text style={s.price}>₹499</Text>
      </View>

      <Text style={s.h1}>A CV the software{"\n"}can actually read</Text>
      <Text style={s.sub}>
        One column, real text, no tables or pictures — the shape an applicant tracking system
        can parse. Type your details; the PDF is laid out for you.
      </Text>

      <Text style={s.section}>You</Text>
      <Text style={s.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={(t) => {
          setName(t);
          setJob(null);
        }}
        placeholder="As it should appear"
        placeholderTextColor={ui.faint}
        style={s.input}
      />
      <Text style={s.label}>Headline (optional)</Text>
      <TextInput
        value={headline}
        onChangeText={setHeadline}
        placeholder="Backend engineer"
        placeholderTextColor={ui.faint}
        style={s.input}
      />
      <View style={s.twoUp}>
        <View style={s.half}>
          <Text style={s.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={ui.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={s.input}
          />
        </View>
        <View style={s.half}>
          <Text style={s.label}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 …"
            placeholderTextColor={ui.faint}
            keyboardType="phone-pad"
            style={s.input}
          />
        </View>
      </View>
      <Text style={s.label}>City (optional)</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="Indore"
        placeholderTextColor={ui.faint}
        style={s.input}
      />
      <Text style={s.help}>
        The email, phone and city print as one contact line, and only the ones you fill in. A CV
        a recruiter cannot act on gets no reply, so the engine warns you when all three are empty.
      </Text>

      <Text style={s.section}>Summary</Text>
      <TextInput
        value={summary}
        onChangeText={(t) => {
          setSummary(t);
          setJob(null);
        }}
        placeholder="Two or three lines on what you do and what you are good at."
        placeholderTextColor={ui.faint}
        multiline
        style={[s.input, s.multiline]}
      />

      <Text style={s.section}>Experience</Text>
      {experience.map((e, i) => (
        <View key={e.id} style={s.entry}>
          <View style={s.entryHead}>
            <Text style={s.entryNo}>Job {i + 1}</Text>
            {experience.length > 1 ? (
              <Pressable
                onPress={() => setExperience((prev) => prev.filter((x) => x.id !== e.id))}
                accessibilityRole="button"
                accessibilityLabel={`Remove job ${i + 1}`}
                style={s.remove}
              >
                <Text style={s.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            value={e.role}
            onChangeText={(t) =>
              setExperience((prev) => prev.map((x) => (x.id === e.id ? { ...x, role: t } : x)))
            }
            placeholder="Role — Senior Engineer"
            placeholderTextColor={ui.faint}
            style={s.input}
          />
          <TextInput
            value={e.org}
            onChangeText={(t) =>
              setExperience((prev) => prev.map((x) => (x.id === e.id ? { ...x, org: t } : x)))
            }
            placeholder="Employer — PaisaFlow"
            placeholderTextColor={ui.faint}
            style={[s.input, s.gapTop]}
          />
          <View style={[s.twoUp, s.gapTop]}>
            <View style={s.half}>
              <TextInput
                value={e.from}
                onChangeText={(t) =>
                  setExperience((prev) => prev.map((x) => (x.id === e.id ? { ...x, from: t } : x)))
                }
                placeholder="From — 2023"
                placeholderTextColor={ui.faint}
                style={s.input}
              />
            </View>
            <View style={s.half}>
              <TextInput
                value={e.to}
                onChangeText={(t) =>
                  setExperience((prev) => prev.map((x) => (x.id === e.id ? { ...x, to: t } : x)))
                }
                placeholder="To — now"
                placeholderTextColor={ui.faint}
                style={s.input}
              />
            </View>
          </View>
          <TextInput
            value={e.bullets}
            onChangeText={(t) =>
              setExperience((prev) => prev.map((x) => (x.id === e.id ? { ...x, bullets: t } : x)))
            }
            placeholder={"One achievement per line\nLed the ledger rewrite\nOwned the reconciliation job"}
            placeholderTextColor={ui.faint}
            multiline
            style={[s.input, s.multiline, s.gapTop]}
          />
          <Text style={s.help}>
            One line is one bullet. Start with what changed and by how much — the first line of
            each bullet is the part that gets read.
          </Text>
        </View>
      ))}
      <Pressable
        style={s.secondary}
        onPress={() =>
          setExperience((prev) => [
            ...prev,
            { id: nextId.current++, role: "", org: "", from: "", to: "", bullets: "" },
          ])
        }
        accessibilityRole="button"
      >
        <Text style={s.secondaryText}>+ Add another job</Text>
      </Pressable>

      <Text style={s.section}>Education</Text>
      {education.map((e, i) => (
        <View key={e.id} style={s.entry}>
          <View style={s.entryHead}>
            <Text style={s.entryNo}>Course {i + 1}</Text>
            <Pressable
              onPress={() => setEducation((prev) => prev.filter((x) => x.id !== e.id))}
              accessibilityRole="button"
              accessibilityLabel={`Remove course ${i + 1}`}
              style={s.remove}
            >
              <Text style={s.removeText}>Remove</Text>
            </Pressable>
          </View>
          <TextInput
            value={e.course}
            onChangeText={(t) =>
              setEducation((prev) => prev.map((x) => (x.id === e.id ? { ...x, course: t } : x)))
            }
            placeholder="Course — B.E. Computer Science"
            placeholderTextColor={ui.faint}
            style={s.input}
          />
          <TextInput
            value={e.org}
            onChangeText={(t) =>
              setEducation((prev) => prev.map((x) => (x.id === e.id ? { ...x, org: t } : x)))
            }
            placeholder="Institution — RGPV"
            placeholderTextColor={ui.faint}
            style={[s.input, s.gapTop]}
          />
          <View style={[s.twoUp, s.gapTop]}>
            <View style={s.half}>
              <TextInput
                value={e.from}
                onChangeText={(t) =>
                  setEducation((prev) => prev.map((x) => (x.id === e.id ? { ...x, from: t } : x)))
                }
                placeholder="From"
                placeholderTextColor={ui.faint}
                style={s.input}
              />
            </View>
            <View style={s.half}>
              <TextInput
                value={e.to}
                onChangeText={(t) =>
                  setEducation((prev) => prev.map((x) => (x.id === e.id ? { ...x, to: t } : x)))
                }
                placeholder="To"
                placeholderTextColor={ui.faint}
                style={s.input}
              />
            </View>
          </View>
          <TextInput
            value={e.note}
            onChangeText={(t) =>
              setEducation((prev) => prev.map((x) => (x.id === e.id ? { ...x, note: t } : x)))
            }
            placeholder="Note (optional) — First class"
            placeholderTextColor={ui.faint}
            style={[s.input, s.gapTop]}
          />
        </View>
      ))}
      <Pressable
        style={s.secondary}
        onPress={() =>
          setEducation((prev) => [
            ...prev,
            { id: nextId.current++, course: "", org: "", from: "", to: "", note: "" },
          ])
        }
        accessibilityRole="button"
      >
        <Text style={s.secondaryText}>+ Add education</Text>
      </Pressable>

      <Text style={s.section}>Skills</Text>
      <TextInput
        value={skills}
        onChangeText={(t) => {
          setSkills(t);
          setJob(null);
        }}
        placeholder="Python, Postgres, Redis"
        placeholderTextColor={ui.faint}
        style={s.input}
      />
      <Text style={s.help}>
        Comma-separated. Type the words a job advert uses — screening software matches the
        words on your CV against the words in the advert, and it does not know that “Postgres”
        and “PostgreSQL” are the same thing.
      </Text>

      {missing ? <Text style={s.missing}>{missing}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (!!missing || busy) && s.dim]}
        onPress={() => void makePdf()}
        disabled={!!missing || busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!missing || busy }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>Make the CV PDF</Text>
        )}
      </Pressable>

      {outputUrl ? (
        <View style={s.result}>
          <Text style={s.label}>Your CV</Text>
          <Pressable
            style={s.secondary}
            onPress={() => openResult(outputUrl, fileName)}
            accessibilityRole="button"
          >
            <Text style={s.secondaryText}>
              {canDownloadFile() ? `Download ${fileName}` : `Open ${fileName}`}
            </Text>
          </Pressable>
          <Text style={s.hint}>
            {meta?.pages ? `${meta.pages} page${meta.pages === 1 ? "" : "s"}` : "Rendered"} of
            selectable text — the words are in the file, not a picture of the words, which is what
            lets a parser read it.
          </Text>
          {warnings.map((w) => (
            <Text key={w} style={s.warn}>
              {w}
            </Text>
          ))}
          <Text style={s.hint}>
            Check the ATS view with “What the parser sees” on the previous screen — it reads the
            same file back to you.
          </Text>
        </View>
      ) : null}

      <Text style={s.foot}>
        Nothing on this page is generated: every line comes from a field you filled in. This CV
        is a document, not a design — the layout exists to be parsed.
      </Text>
    </ScrollView>
  );
}

function makeStyles(ui: ProductUI) {
  const ACCENT = ui.accent;
  const INK = ui.ink;
  const MUTED = ui.muted;
  const LINE = ui.hairline;
  const BG = ui.bg;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    wrap: { padding: 22, paddingBottom: 56, maxWidth: 520, width: "100%", alignSelf: "center" },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    badge: { color: ACCENT, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
    price: { color: INK, fontSize: 20, fontWeight: "800" },
    h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 10 },
    sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 6 },
    section: { color: INK, fontSize: 15, fontWeight: "800", marginTop: 24, marginBottom: 10 },
    label: { color: INK, fontWeight: "700", fontSize: 12.5, marginBottom: 6, marginTop: 10 },
    input: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 14.5,
      color: INK,
      backgroundColor: ui.surface,
    },
    multiline: { minHeight: 92, textAlignVertical: "top" },
    twoUp: { flexDirection: "row", gap: 10 },
    half: { flex: 1 },
    gapTop: { marginTop: 8 },
    entry: {
      borderWidth: 1,
      borderColor: LINE,
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
      backgroundColor: ui.c.surfaceSunken,
    },
    entryHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    entryNo: { color: MUTED, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
    remove: { paddingVertical: 4, paddingHorizontal: 6 },
    removeText: { color: MUTED, fontSize: 12, fontWeight: "700" },
    secondary: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: ui.surface,
      marginTop: 4,
    },
    secondaryText: { color: INK, fontWeight: "700", fontSize: 14 },
    help: { color: MUTED, fontSize: 12.5, lineHeight: 18, marginTop: 6 },
    missing: { color: ui.error, fontSize: 13, lineHeight: 19, marginTop: 14 },
    error: { color: ui.error, fontSize: 13.5, lineHeight: 19, marginTop: 14, fontWeight: "600" },
    primary: {
      backgroundColor: ACCENT,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 16,
    },
    dim: { opacity: 0.45 },
    primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    result: { marginTop: 18, gap: 8 },
    hint: { color: MUTED, fontSize: 12.5, lineHeight: 18 },
    // The engine's warnings are advice, not failures: emphasised, but deliberately not in
    // the error colour — a CV with no phone number is still a CV.
    warn: { color: INK, fontSize: 12.5, lineHeight: 18, fontWeight: "600" },
    foot: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 26 },
  });
}
