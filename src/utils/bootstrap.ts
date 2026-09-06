import {
  dbMemberToFrontend, dbVisitorToFrontend, dbAttendanceToFrontend, dbEventToFrontend,
  dbDonationToFrontend, dbFollowUpToFrontend, dbMinistryToFrontend, dbSermonToFrontend,
  dbAnnouncementToFrontend, dbPrayerToFrontend, dbDevotionalToFrontend, dbMediaToFrontend,
  dbMemberToOption, dbLeaderToOption,
} from '../dataMapper';
import {
  dbHouseholdToFrontend, dbFundToFrontend, dbCampaignToFrontend, dbPledgeToFrontend,
  dbVolunteerRoleToFrontend, dbVolunteerAssignmentToFrontend, dbSongToFrontend,
  dbWorshipPlanToFrontend, dbCommunicationToFrontend, dbFormToFrontend,
  dbCheckInToFrontend, dbFinanceToFrontend,
} from '../chMeetingsMapper';
import { dbBookToFrontend, dbLiveStreamToFrontend } from '../innovationMapper';
import { DashboardInsights } from '../types';

export interface BootstrapPayload {
  settings: { currencyCode: string; currencySymbol: string };
  members: unknown[];
  visitors: unknown[];
  attendance: unknown[];
  events: unknown[];
  donations: unknown[];
  followups: unknown[];
  ministries: unknown[];
  sermons: unknown[];
  announcements: unknown[];
  prayer: unknown[];
  devotionals: unknown[];
  media: unknown[];
  leaders: unknown[];
  households: unknown[];
  funds: unknown[];
  campaigns: unknown[];
  pledges: unknown[];
  volunteerRoles: unknown[];
  volunteerAssignments: unknown[];
  songs: unknown[];
  worshipPlans: unknown[];
  communications: unknown[];
  forms: unknown[];
  checkins: unknown[];
  finance: unknown[];
  insights: DashboardInsights;
  books: unknown[];
  livestreams: unknown[];
  bookPurchases: number[];
}

export function mapBootstrapToState(data: BootstrapPayload) {
  const membersFrontend = data.members.map(dbMemberToFrontend);
  return {
    currencyCode: data.settings.currencyCode || 'USD',
    currencySymbol: data.settings.currencySymbol || '$',
    members: membersFrontend,
    visitors: data.visitors.map(dbVisitorToFrontend),
    attendance: data.attendance.map(dbAttendanceToFrontend),
    events: data.events.map(dbEventToFrontend),
    giving: data.donations.map(dbDonationToFrontend),
    followUps: data.followups.map(dbFollowUpToFrontend),
    departments: data.ministries.map(dbMinistryToFrontend),
    sermons: data.sermons.map(dbSermonToFrontend),
    announcements: data.announcements.map(dbAnnouncementToFrontend),
    prayerRequests: data.prayer.map(dbPrayerToFrontend),
    devotionals: data.devotionals.map(dbDevotionalToFrontend),
    mediaAssets: data.media.map(dbMediaToFrontend),
    memberOptions: data.members.map(dbMemberToOption),
    leaderOptions: data.leaders.map(dbLeaderToOption),
    households: data.households.map(dbHouseholdToFrontend),
    funds: data.funds.map(dbFundToFrontend),
    campaigns: data.campaigns.map(dbCampaignToFrontend),
    pledges: data.pledges.map(dbPledgeToFrontend),
    volunteerRoles: data.volunteerRoles.map(dbVolunteerRoleToFrontend),
    volunteerAssignments: data.volunteerAssignments.map(dbVolunteerAssignmentToFrontend),
    songs: data.songs.map(dbSongToFrontend),
    worshipPlans: data.worshipPlans.map(dbWorshipPlanToFrontend),
    communications: data.communications.map(dbCommunicationToFrontend),
    customForms: data.forms.map(dbFormToFrontend),
    checkIns: data.checkins.map(dbCheckInToFrontend),
    transactions: data.finance.map(dbFinanceToFrontend),
    insights: data.insights,
    books: data.books.map(dbBookToFrontend),
    liveStreams: data.livestreams.map(dbLiveStreamToFrontend),
    purchasedBookIds: data.bookPurchases.map((id: number) => `BK-${id}`),
    membersFrontend,
  };
}
