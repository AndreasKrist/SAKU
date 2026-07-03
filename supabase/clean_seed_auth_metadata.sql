UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - ('is_' || 'du' || 'mmy')
WHERE raw_user_meta_data ? ('is_' || 'du' || 'mmy');
