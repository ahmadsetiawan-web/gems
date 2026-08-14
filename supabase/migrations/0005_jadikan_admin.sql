-- Jadikan akun ini admin pertama GEMS.
-- status_approval juga dipastikan 'approved' supaya tidak terblokir dashboard.
update profiles
set role = 'admin', status_approval = 'approved'
where email = 'ahmadsetiawan01@gmail.com';
