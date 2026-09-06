import React, { useState } from 'react';
import { formsApi } from '../api';

const GUEST_CATEGORIES = [
  'Government/Political Leader',
  'Religious Leader',
  'Traditional Leader',
  'Business/Corporate Leader',
  'Diplomat',
  'Academic/Educational Leader',
  'Community Leader',
  'Media/Public Figure',
  'Former Member',
  'Family/Friend of REV DR SAM ATO BENTIL',
  'Former Colleague/Associate',
  'Other',
];

const KNOW_OPTIONS = [
  'Personally',
  'Professionally',
  'Through the Church',
  'Through REV DR SAM ATO BENTIL',
  'Family/Family Friend',
  'Other',
];

const PRIORITY_OPTIONS = [
  { value: 'Very High Priority – Should definitely be invited', short: 'Very High' },
  { value: 'High Priority – Strongly recommended', short: 'High' },
  { value: 'Medium Priority – Worth considering', short: 'Medium' },
  { value: 'Other', short: 'Other' },
];

const LIKELIHOOD_OPTIONS = ['Very likely', 'Likely', 'Uncertain', 'Unlikely', "Don't know"];

const YES_NO = ['Yes', 'No'];
const YES_NO_NA = ['Yes', 'No', 'Not applicable'];

type GuestDraft = {
  fullName: string;
  titlePosition: string;
  organization: string;
  category: string;
  categoryOther: string;
  currentStatus: string;
  location: string;
  telephone: string;
  whatsapp: string;
  email: string;
  officeContact: string;
  connection: string;
  knowHow: string;
  knowHowOther: string;
  directRelationship: string;
  assistIntroduction: string;
  additionalInfo: string;
  priority: string;
  priorityOther: string;
  likelyAttend: string;
  requestRepresentative: string;
};

const emptyGuest = (): GuestDraft => ({
  fullName: '',
  titlePosition: '',
  organization: '',
  category: '',
  categoryOther: '',
  currentStatus: '',
  location: '',
  telephone: '',
  whatsapp: '',
  email: '',
  officeContact: '',
  connection: '',
  knowHow: '',
  knowHowOther: '',
  directRelationship: '',
  assistIntroduction: '',
  additionalInfo: '',
  priority: '',
  priorityOther: '',
  likelyAttend: '',
  requestRepresentative: '',
});

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}{required ? <span className="text-rose-500"> *</span> : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 ${props.className || ''}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 ${props.className || ''}`}
    />
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
  required,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-required={required}>
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition ${
            value === opt ? 'border-amber-500 bg-amber-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <input
            type="radio"
            name={name}
            required={required && !value}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="mt-0.5 accent-amber-600"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function flattenGuest(prefix: string, g: GuestDraft): Record<string, string> {
  const category = g.category === 'Other' && g.categoryOther ? `Other: ${g.categoryOther}` : g.category;
  const knowHow = g.knowHow === 'Other' && g.knowHowOther ? `Other: ${g.knowHowOther}` : g.knowHow;
  const priority = g.priority === 'Other' && g.priorityOther ? `Other: ${g.priorityOther}` : g.priority;
  return {
    [`${prefix} Full Name`]: g.fullName,
    [`${prefix} Title/Position`]: g.titlePosition,
    [`${prefix} Organization/Institution/Church`]: g.organization,
    [`${prefix} Category`]: category,
    [`${prefix} Current Status/Position`]: g.currentStatus,
    [`${prefix} Location/City/Country`]: g.location,
    [`${prefix} Telephone`]: g.telephone,
    [`${prefix} WhatsApp`]: g.whatsapp || g.telephone,
    [`${prefix} Email`]: g.email,
    [`${prefix} Office/Official Contact`]: g.officeContact,
    [`${prefix} Connection to REV DR SAM ATO BENTIL or Church`]: g.connection,
    [`${prefix} How well do you know them`]: knowHow,
    [`${prefix} Direct relationship/contact`]: g.directRelationship,
    [`${prefix} Willing to assist introduction`]: g.assistIntroduction,
    [`${prefix} Additional approach info`]: g.additionalInfo,
    [`${prefix} Invitation priority`]: priority,
    [`${prefix} Likely to attend`]: g.likelyAttend,
    [`${prefix} Request representative if unable`]: g.requestRepresentative,
  };
}

export default function VipGuestNominationView() {
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberMinistry, setMemberMinistry] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [guests, setGuests] = useState<GuestDraft[]>([emptyGuest()]);
  const [otherRecommendations, setOtherRecommendations] = useState('');
  const [otherWhy, setOtherWhy] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const updateGuest = (index: number, patch: Partial<GuestDraft>) => {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const addGuest = () => {
    if (guestCount >= 4) return;
    setGuests((prev) => [...prev, emptyGuest()]);
    setGuestCount((c) => c + 1);
  };

  const removeGuest = (index: number) => {
    if (index === 0 || guestCount <= 1) return;
    setGuests((prev) => prev.filter((_, i) => i !== index));
    setGuestCount((c) => c - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guests[0]?.fullName.trim()) {
      setErrorMsg('Please provide at least Guest 1 full name.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const form = await formsApi.ensureVipNomination();
      const formId = typeof form.id === 'number' ? form.id : parseInt(String(form.id).replace(/^FORM-/i, ''), 10);

      const responses: Record<string, string> = {
        'Member Name': memberName,
        'Member Telephone/WhatsApp': memberPhone,
        'Member Ministry/Department/Group': memberMinistry,
        'Other distinguished recommendations': otherRecommendations,
        'Why recommend them': otherWhy,
        'Number of VIP guests nominated': String(guestCount),
      };

      guests.forEach((g, i) => {
        if (!g.fullName.trim() && i > 0) return;
        Object.assign(responses, flattenGuest(`Guest ${i + 1}`, g));
      });

      await formsApi.submit(formId, {
        submitter_name: memberName,
        submitter_email: guests[0]?.email || '',
        responses,
      });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      const detail = err instanceof Error ? err.message : '';
      setErrorMsg(
        detail.includes('ENOTFOUND') || detail.toLowerCase().includes('database')
          ? 'The church database is offline right now. Please try again in a few minutes, or contact the church office.'
          : detail
            ? `Submission failed: ${detail}`
            : 'Submission failed. Please try again.'
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#f7f3ea] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-2xl">
            <i className="bi bi-check-lg" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Thank you</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Your VIP guest nomination has been received by the Protocol/Planning Committee for the
            retirement and send-off celebration of REV DR SAM ATO BENTIL.
          </p>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            An appreciation SMS has been sent to your phone. On the program day, scan the church QR code
            (<span className="font-mono text-xs"> ?view=vip-checkin</span>) to mark that you came.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <div className="relative overflow-hidden border-b border-amber-200/70 bg-[#1f2a1c] text-[#f7f3ea]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#c9a227,transparent_40%),radial-gradient(circle_at_80%_0%,#4a6741,transparent_35%)]" />
        <div className="relative mx-auto max-w-3xl px-5 py-10 sm:py-14">
          <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/90">Liberty Assemblies of God</p>
          <h1 className="mt-3 text-2xl sm:text-4xl font-semibold leading-tight">
            VIP Guest Nomination Questionnaire
          </h1>
          <p className="mt-3 text-sm sm:text-base text-amber-50/85 max-w-2xl leading-relaxed">
            REV DR SAM ATO BENTIL&apos;s Retirement &amp; Send-Off Celebration — recommend distinguished
            guests for an official invitation.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-slate-700 leading-relaxed">
          Please provide accurate information. All details will be used by the Planning/Protocol Committee
          solely for purposes related to the retirement and send-off celebration.
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SectionCard title="A. Your Information">
            <div>
              <FieldLabel required>Name of Member</FieldLabel>
              <TextInput required value={memberName} onChange={(e) => setMemberName(e.target.value)} />
            </div>
            <div>
              <FieldLabel required>Telephone / WhatsApp Number</FieldLabel>
              <TextInput required value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Ministry / Department / Group (if applicable)</FieldLabel>
              <TextInput value={memberMinistry} onChange={(e) => setMemberMinistry(e.target.value)} />
            </div>
          </SectionCard>

          {guests.map((guest, index) => {
            const isPrimary = index === 0;
            return (
              <SectionCard
                key={index}
                title={isPrimary ? 'B. Prospective VIP Guest Information — Guest 1' : `D. Additional VIP Guest — Guest ${index + 1}`}
                subtitle={isPrimary ? 'Complete details for your primary nomination.' : 'Provide key details for this additional guest.'}
              >
                {!isPrimary && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeGuest(index)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                      Remove Guest {index + 1}
                    </button>
                  </div>
                )}

                <div>
                  <FieldLabel required={isPrimary}>Full Name</FieldLabel>
                  <TextInput required={isPrimary} value={guest.fullName} onChange={(e) => updateGuest(index, { fullName: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Title / Position</FieldLabel>
                  <TextInput
                    value={guest.titlePosition}
                    onChange={(e) => updateGuest(index, { titlePosition: e.target.value })}
                    placeholder="e.g. Former President, Minister, Ambassador, CEO, Bishop..."
                  />
                </div>
                <div>
                  <FieldLabel>Organization / Institution / Church</FieldLabel>
                  <TextInput value={guest.organization} onChange={(e) => updateGuest(index, { organization: e.target.value })} />
                </div>

                <div>
                  <FieldLabel required={isPrimary}>Category of Guest</FieldLabel>
                  <RadioGroup
                    name={`category-${index}`}
                    options={GUEST_CATEGORIES}
                    value={guest.category}
                    onChange={(v) => updateGuest(index, { category: v })}
                    required={isPrimary}
                  />
                  {guest.category === 'Other' && (
                    <div className="mt-2">
                      <TextInput
                        required={isPrimary}
                        placeholder="Please specify"
                        value={guest.categoryOther}
                        onChange={(e) => updateGuest(index, { categoryOther: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Current Status / Position</FieldLabel>
                    <TextInput value={guest.currentStatus} onChange={(e) => updateGuest(index, { currentStatus: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>Location / City / Country</FieldLabel>
                    <TextInput value={guest.location} onChange={(e) => updateGuest(index, { location: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Telephone Number</FieldLabel>
                    <TextInput value={guest.telephone} onChange={(e) => updateGuest(index, { telephone: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>WhatsApp Number (if different)</FieldLabel>
                    <TextInput value={guest.whatsapp} onChange={(e) => updateGuest(index, { whatsapp: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Email Address</FieldLabel>
                    <TextInput type="email" value={guest.email} onChange={(e) => updateGuest(index, { email: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>Office / Official Contact</FieldLabel>
                    <TextInput value={guest.officeContact} onChange={(e) => updateGuest(index, { officeContact: e.target.value })} />
                  </div>
                </div>

                <div>
                  <FieldLabel required={isPrimary}>How is this person connected to REV DR SAM ATO BENTIL or the Church?</FieldLabel>
                  <TextArea
                    required={isPrimary}
                    rows={3}
                    value={guest.connection}
                    onChange={(e) => updateGuest(index, { connection: e.target.value })}
                  />
                </div>

                {isPrimary ? (
                  <>
                    <div>
                      <FieldLabel>How well do you know the prospective guest?</FieldLabel>
                      <RadioGroup
                        name={`know-${index}`}
                        options={KNOW_OPTIONS}
                        value={guest.knowHow}
                        onChange={(v) => updateGuest(index, { knowHow: v })}
                      />
                      {guest.knowHow === 'Other' && (
                        <div className="mt-2">
                          <TextInput
                            placeholder="Please specify"
                            value={guest.knowHowOther}
                            onChange={(e) => updateGuest(index, { knowHowOther: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <FieldLabel>Do you have a direct relationship / contact with this person?</FieldLabel>
                      <RadioGroup
                        name={`direct-${index}`}
                        options={YES_NO}
                        value={guest.directRelationship}
                        onChange={(v) => updateGuest(index, { directRelationship: v })}
                      />
                    </div>

                    <div>
                      <FieldLabel>Would you be willing to assist the Protocol Committee in making an initial introduction / contact?</FieldLabel>
                      <RadioGroup
                        name={`assist-${index}`}
                        options={YES_NO}
                        value={guest.assistIntroduction}
                        onChange={(v) => updateGuest(index, { assistIntroduction: v })}
                      />
                    </div>

                    <div>
                      <FieldLabel>Any additional information that may help us appropriately approach this guest?</FieldLabel>
                      <TextArea rows={3} value={guest.additionalInfo} onChange={(e) => updateGuest(index, { additionalInfo: e.target.value })} />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800">C. Priority / VIP Assessment</h3>
                      <div>
                        <FieldLabel>In your opinion, how important is it that this person receives a formal invitation?</FieldLabel>
                        <RadioGroup
                          name={`priority-${index}`}
                          options={PRIORITY_OPTIONS.map((p) => p.value)}
                          value={guest.priority}
                          onChange={(v) => updateGuest(index, { priority: v })}
                        />
                        {guest.priority === 'Other' && (
                          <div className="mt-2">
                            <TextInput
                              placeholder="Please explain"
                              value={guest.priorityOther}
                              onChange={(e) => updateGuest(index, { priorityOther: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <FieldLabel>Do you believe this guest is likely to attend if formally invited?</FieldLabel>
                        <RadioGroup
                          name={`likely-${index}`}
                          options={LIKELIHOOD_OPTIONS}
                          value={guest.likelyAttend}
                          onChange={(v) => updateGuest(index, { likelyAttend: v })}
                        />
                      </div>
                      <div>
                        <FieldLabel>If the guest is unable to attend, would you recommend requesting a representative?</FieldLabel>
                        <RadioGroup
                          name={`rep-${index}`}
                          options={YES_NO_NA}
                          value={guest.requestRepresentative}
                          onChange={(v) => updateGuest(index, { requestRepresentative: v })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <FieldLabel>Relationship to REV DR SAM ATO BENTIL / Church</FieldLabel>
                      <TextArea rows={2} value={guest.connection} onChange={(e) => updateGuest(index, { connection: e.target.value })} />
                    </div>
                    <div>
                      <FieldLabel>Your relationship / contact with guest</FieldLabel>
                      <TextArea rows={2} value={guest.knowHow} onChange={(e) => updateGuest(index, { knowHow: e.target.value })} />
                    </div>
                    <div>
                      <FieldLabel>Priority</FieldLabel>
                      <RadioGroup
                        name={`priority-${index}`}
                        options={['Very High', 'High', 'Medium']}
                        value={guest.priority}
                        onChange={(v) => updateGuest(index, { priority: v })}
                      />
                    </div>
                    <div>
                      <FieldLabel>Additional comments</FieldLabel>
                      <TextArea rows={2} value={guest.additionalInfo} onChange={(e) => updateGuest(index, { additionalInfo: e.target.value })} />
                    </div>
                  </>
                )}
              </SectionCard>
            );
          })}

          {guestCount < 4 && (
            <button
              type="button"
              onClick={addGuest}
              className="w-full rounded-2xl border border-dashed border-amber-400 bg-white/70 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-50"
            >
              + Add another VIP guest ({guestCount}/4)
            </button>
          )}

          <SectionCard title="E. Other Recommendations" subtitle="Distinguished individuals, institutions, churches, organizations, or groups">
            <div>
              <FieldLabel>Recommendations</FieldLabel>
              <TextArea rows={3} value={otherRecommendations} onChange={(e) => setOtherRecommendations(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Please explain why you recommend them</FieldLabel>
              <TextArea rows={3} value={otherWhy} onChange={(e) => setOtherWhy(e.target.value)} />
            </div>
          </SectionCard>

          {status === 'error' && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-2xl bg-[#1f2a1c] px-4 py-3.5 text-sm font-semibold text-[#f7f3ea] hover:bg-[#2a3926] disabled:opacity-60"
          >
            {status === 'loading' ? 'Submitting…' : 'Submit Nomination'}
          </button>

          <p className="text-center text-xs text-slate-500 pb-8">
            Thank you for helping us honor the life, ministry, and service of REV DR SAM ATO BENTIL.
          </p>
        </form>
      </div>
    </div>
  );
}
