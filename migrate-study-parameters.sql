-- Run after supabase-schema.sql. Existing questions, profiles, and statistics are preserved.
begin;

do $migration$
declare
  content public.site_content%rowtype;
  v_questions jsonb;
  v_parameters jsonb;
  v_profiles jsonb;
  q16 jsonb := '{
    "id":"q16","type":"category","text":"אני מחפש ישיבה:",
    "options":[
      {"id":"1","label":"רמבמיסטית","tags":[]},
      {"id":"2","label":"חסידית","tags":[]},
      {"id":"3","label":"גם וגם","tags":[]},
      {"id":"4","label":"לא ולא","tags":[]},
      {"id":"unknown","label":"לא יודע","tags":[]}
    ]
  }'::jsonb;
  q17 jsonb;
begin
  select * into content from public.site_content where id = 'main' for update;
  if not found then
    raise exception 'site_content main does not exist; initialize the site first.';
  end if;

  select jsonb_build_object(
    'id', 'q17', 'type', 'slider', 'text', 'איזה סגנון למידה הכי מתאים לך?',
    'options', jsonb_agg(jsonb_build_object(
      'id', n::text, 'label', n::text, 'tags', jsonb_build_array('intanse_study'),
      'weights', jsonb_build_object('intanse_study', n)
    ) order by n)
  ) into q17 from generate_series(1, 10) as n;

  if exists (
    select 1 from jsonb_array_elements(content.questions) q
    where (q->>'id' = 'q16' and q->>'type' is distinct from 'category')
       or (q->>'id' = 'q17' and q->>'type' is distinct from 'slider')
  ) then
    raise exception 'Question ID q16 or q17 is already used by another question; resolve the conflict before migration.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(content.questions) q
    where q->>'id' in ('q16', 'q17')
      and (
        jsonb_typeof(q->'options') is distinct from 'array'
        or (q->>'id' = 'q16' and (
          jsonb_array_length(q->'options') <> 5 or exists (
            select 1 from unnest(array['1','2','3','4','unknown']) expected(id)
            where not exists (select 1 from jsonb_array_elements(q->'options') o where o->>'id' = expected.id)
          )
        ))
        or (q->>'id' = 'q17' and (
          jsonb_array_length(q->'options') <> 10 or exists (
            select 1 from generate_series(1, 10) expected(id)
            where not exists (select 1 from jsonb_array_elements(q->'options') o where o->>'id' = expected.id::text)
          )
        ))
      )
  ) then
    raise exception 'Question q16 or q17 has incompatible options; resolve the conflict before migration.';
  end if;

  v_questions := content.questions;
  if not exists (select 1 from jsonb_array_elements(v_questions) q where q->>'id' = 'q16') then
    v_questions := v_questions || jsonb_build_array(q16);
  end if;
  if not exists (select 1 from jsonb_array_elements(v_questions) q where q->>'id' = 'q17') then
    v_questions := v_questions || jsonb_build_array(q17);
  end if;

  select coalesce(jsonb_agg(
    (case when p ? 'weight' then p
    else p || jsonb_build_object('weight', case when p->>'id' = 'rambamizem' then 4 else 1 end)
    end) || case when p->>'id' = 'intanse_study'
      and p->>'description' = '1 - אינטנסיבי וממוקד הישגים; 10 - לוז חופשי'
      then jsonb_build_object('description', '1 - לוז חופשי; 10 - אינטנסיבי וממוקד הישגים')
      else '{}'::jsonb end order by ord
  ), '[]'::jsonb) into v_parameters
  from jsonb_array_elements(content.parameters) with ordinality as items(p, ord);

  if not exists (select 1 from jsonb_array_elements(v_parameters) p where p->>'id' = 'rambamizem') then
    v_parameters := v_parameters || '[{"id":"rambamizem","label":"רמבמיסטית / חסידית","description":"סגנון הישיבה","weight":4}]'::jsonb;
  end if;
  if not exists (select 1 from jsonb_array_elements(v_parameters) p where p->>'id' = 'intanse_study') then
    v_parameters := v_parameters || '[{"id":"intanse_study","label":"סגנון למידה","description":"1 - לוז חופשי; 10 - אינטנסיבי וממוקד הישגים","weight":1}]'::jsonb;
  end if;

  if exists (
    select 1 from jsonb_array_elements(content.yeshivot) y
    where (y->'profileTags'->>'rambamizem' is not null
      and y->'profileTags'->>'rambamizem' not in ('1', '2', '3', '4'))
      or (y->'profileTags'->>'intanse_study' is not null
      and y->'profileTags'->>'intanse_study' not in ('1','2','3','4','5','6','7','8','9','10'))
  ) then
    raise exception 'An existing study profile value is invalid. Correct it before running this migration.';
  end if;

  with spreadsheet(id, name, intensity, category) as (
    values
      ('yeshiva_1','אור וישועה',6,1), ('yeshiva_2','אורות שאול',6,2),
      ('yeshiva_3','איילת השחר',7,4), ('yeshiva_4','איתמר',7,4),
      ('yeshiva_5','אלון מורה',8,4), ('yeshiva_6','בית אל',9,4),
      ('yeshiva_7','גבעת אולגה',3,4), ('yeshiva_8','הגולן',6,4),
      ('yeshiva_9','ההסדר ירוחם',10,1), ('yeshiva_10','ההסדר מאיר הראל',7,1),
      ('yeshiva_11','ההסדר נוף הגליל',5,4), ('yeshiva_12','ההסדר עכו',4,4),
      ('yeshiva_13','ההסדר צפת',4,2), ('yeshiva_14','ההסדר קריית שמונה',5,4),
      ('yeshiva_15','ההסדר קרני שומרון',6,4), ('yeshiva_16','ההסדר ראשון לציון',4,4),
      ('yeshiva_17','ההסדר שעלבים',8,1), ('yeshiva_18','הכותל',7,4),
      ('yeshiva_19','המאירי',2,4), ('yeshiva_20','הסדר חולון',5,2),
      ('yeshiva_21','הר ברכה',6,4), ('yeshiva_22','הר המור',10,4),
      ('yeshiva_23','הר עציון',10,1), ('yeshiva_24','טפחות',6,4),
      ('yeshiva_25','כרם ביבנה',8,4), ('yeshiva_26','מדברה כעדן',9,4),
      ('machanim','מחנים',6,3), ('yeshiva_28','מעלה אליהו',7,4),
      ('yeshiva_29','מעלות',6,4), ('yeshiva_30','מרכז הרב',10,4),
      ('yeshiva_31','נהריה',5,2), ('yeshiva_32','נוה דקלים',5,4),
      ('yeshiva_33','עתניאל',7,2), ('yeshiva_34','קדומים',8,4),
      ('yeshiva_35','רעותא',5,2), ('yeshiva_36','שבי חברון',8,4),
      ('yeshiva_37','שיח יצחק',5,3), ('yeshiva_38','תקוע',4,2),
      ('yeshiva_39','מטיבתא',4,2), ('yeshiva_40','מעלה גלבוע',5,3)
  )
  select coalesce(jsonb_agg(
    case when s.id is null then y
    else jsonb_set(y, '{profileTags}',
      jsonb_build_object('intanse_study', s.intensity, 'rambamizem', s.category)
      || coalesce(y->'profileTags', '{}'::jsonb))
    end order by ord
  ), '[]'::jsonb) into v_profiles
  from jsonb_array_elements(content.yeshivot) with ordinality as items(y, ord)
  left join spreadsheet s on s.id = y->>'id'
    and (s.name = trim(y->>'shortName') or s.name = trim(y->>'name')
      or (s.id = 'yeshiva_40' and trim(y->>'shortName') = 'מעלה גבלוע'));

  raise notice 'Profiles missing a study value after migration: %',
    (select count(*) from jsonb_array_elements(v_profiles) y
      where y->'profileTags'->>'rambamizem' is null or y->'profileTags'->>'intanse_study' is null);

  update public.site_content set questions = v_questions, parameters = v_parameters, yeshivot = v_profiles,
    updated_at = now() where id = 'main';
end;asd
$migration$;

commit;
