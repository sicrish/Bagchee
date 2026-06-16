// Membership helpers.
//
// `User.membership` is a String ('active' | 'inactive') paired with a `membershipEnd`
// date (set to purchase + 1 year by the PayPal/Razorpay grant code). Historically
// NOTHING ever flipped 'active' -> 'inactive' when membershipEnd passed, so expired
// members kept the 10% perk and the "member" UI forever (e.g. admin@bagchee.com,
// end 2026-04-30, still showing as a member).
//
// `isMembershipActive` is the single source of truth: the user is a member only if
// flagged 'active' AND the end date has not passed. A null end date (some migrated
// rows) is treated as active — we never downgrade something we can't prove is expired.
export const isMembershipActive = (user, now = new Date()) => {
    if (!user || user.membership !== 'active') return false;
    if (!user.membershipEnd) return true;
    return new Date(user.membershipEnd) >= now;
};

// True when a user is flagged 'active' but the end date is in the past — i.e. they
// should be downgraded. Lets callers cheaply decide whether to write the correction.
export const isMembershipExpired = (user, now = new Date()) =>
    user?.membership === 'active' && !isMembershipActive(user, now);
