# Troubleshooting

## Common Issues

### "I can't access the admin dashboard"

**Possible causes:**
- You're not signed in — visit `/login` to authenticate
- Your account doesn't have admin privileges — contact your organization admin
- Your trial has expired — go to Settings to upgrade your plan
- You're on the wrong subdomain — make sure you're on your organization's URL

### "My public site shows no data"

**Possible causes:**
- No tournaments or teams have been created yet — use the admin dashboard to add content
- Matches haven't been scheduled — create matches within tournament groups
- Data belongs to a different organization — check that you're on the correct subdomain

### "Standings are not updating"

**Check these:**
- Match status must be "Completed" for results to count in standings
- Only tournament matches affect standings — friendly matches are excluded
- Make sure the match belongs to the correct tournament group
- Verify that the correct scores have been entered

### "I can't publish news articles"

**Solution:** News publishing is a Pro feature. If you're on the Basic plan, upgrade from Settings to unlock this feature.

### "I can't add more teams"

**Solution:** The Basic plan has a team limit. Upgrade to Pro for unlimited teams. Check your current limit in Settings.

### "Match operator can't sign in"

**Check these:**
- Verify the operator account was created correctly in the Match Operators section
- Ensure the operator is using the correct email address
- Match Operators is a Pro feature — confirm your plan includes it
- The operator should access `/admin/operator` after signing in

### "Images aren't displaying"

**Check these:**
- Ensure images were uploaded successfully in the Media Library
- Check that the image format is supported (JPG, PNG, WebP)
- Verify the Supabase Storage bucket is configured correctly
- Large images may take a moment to load

### "Theme changes aren't showing"

**Try these:**
- Hard-refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
- Clear your browser cache
- Check that the theme was saved in Settings
- Theme changes apply to the public site, not the admin panel

## Getting Help

If your issue isn't covered here:
1. Check the **Help Center** (`/help`) for searchable articles
2. Use the **Help** button in the admin navigation bar
3. Review contextual tips on each admin page
4. Contact support through your account settings (Pro plan)

## Browser Compatibility

For the best experience, use a recent version of:
- Google Chrome
- Mozilla Firefox
- Apple Safari
- Microsoft Edge

Clear your browser cache if you experience display issues after an update.
