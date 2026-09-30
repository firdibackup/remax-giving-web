begin;

-- Donor name masking v2: Ratina Sari -> Rat**a S., Siti Rahmawati -> S**i R.
-- For databases that already ran 01-13; fresh installs get this from 01_schema.sql.
create or replace function home_of_giving_private.mask_donor_name(full_name text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  cleaned text;
  parts text[];
  total integer;
  head text;
  tail text;
  first_len integer;
begin
  cleaned := btrim(regexp_replace(coalesce(full_name, ''), '\s+', ' ', 'g'));

  if cleaned = '' then
    return 'Donatur';
  end if;

  parts := string_to_array(cleaned, ' ');
  total := array_length(parts, 1);
  first_len := char_length(parts[1]);

  -- Ratina -> Rat**a; names of 4 letters or fewer keep only first + last: Siti -> S**i.
  if first_len > 4 then
    head := left(parts[1], 3) || repeat('*', first_len - 4) || right(parts[1], 1);
  elsif first_len > 2 then
    head := left(parts[1], 1) || repeat('*', first_len - 2) || right(parts[1], 1);
  else
    head := left(parts[1], 1) || '*';
  end if;

  if total = 1 then
    return head;
  end if;

  tail := upper(left(parts[total], 1)) || '.';
  return head || ' ' || tail;
end;
$$;

-- The old check required '***'; short names now mask with fewer stars (A*i).
alter table home_of_giving.donations
  drop constraint if exists donations_public_name_masked;

-- Re-mask donations that have a private full name; legacy seed rows keep their stored name.
update home_of_giving.donations d
set public_name = home_of_giving_private.mask_donor_name(i.full_name)
from home_of_giving_private.donor_identities i
where i.id = d.donor_identity_id
  and d.public_name is distinct from home_of_giving_private.mask_donor_name(i.full_name);

alter table home_of_giving.donations
  add constraint donations_public_name_masked check (
    public_name = 'Anonim' or position('*' in public_name) > 0
  );

commit;
