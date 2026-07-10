-- Set admin role for specified wallet address
update public.profiles_arcworker
set role = 'admin'
where lower(wallet_address) = lower('0xe27f8bAd54cdfc3f81FB47531E853c9517CE035B');
