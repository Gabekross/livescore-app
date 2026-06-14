-- Update default homepage hero copy for existing orgs that still use starter text.
-- Custom admin-written taglines are left untouched.

update public.site_settings ss
set
  site_tagline = 'Fixtures, results, standings and tournament updates.',
  updated_at = now()
from public.organizations o
where ss.organization_id = o.id
  and lower(o.slug) in ('jesuschampionsleague', 'jcl26')
  and (
    ss.site_tagline is null
    or trim(ss.site_tagline) = ''
    or ss.site_tagline in (
      'Official League Platform',
      'Live football scores, fixtures and standings.',
      'Live scores, fixtures, standings, and more.'
    )
  );
