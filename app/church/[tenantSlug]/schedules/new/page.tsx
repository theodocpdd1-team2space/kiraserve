"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/lib/supabase/client";
import { getChurchAccess } from "@/lib/church/access";

type RelationArray<T> = T[] | T | null;

type Division = {
  id: string;
  name: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
};

type ScheduleMode =
  | "MULTI_SESSION_BY_DATE"
  | "MONTHLY_MULTI_DATE"
  | "SINGLE_SESSION";

type BuilderColumn = {
  id: string;
  label: string;
  date?: string | null;
  start_time: string | null;
  end_time: string | null;
};

type BuilderCell = {
  display_name: string;
  profile_id?: string | null;
  email?: string | null;
};

type BuilderRow = {
  id: string;
  label: string;
  serving_role_id?: string | null;
  cells: BuilderCell[];
};

type BuilderGroup = {
  id: string;
  title: string;
  date: string | null;
  note: string;
  columns: BuilderColumn[];
  rows: BuilderRow[];
};

type Profile = {
  id: string;
  name: string | null;
  email: string;
  avatar_url?: string | null;
};

type DivisionMember = {
  id: string;
  profile_id: string;
  role: string;
  profiles: Profile | null;
};

type RawDivisionMember = {
  id: string;
  profile_id: string;
  role: string;
  profiles: RelationArray<Profile>;
};

type ServingRole = {
  id: string;
  name: string;
  description: string | null;
};

type MemberServingRole = {
  id: string;
  profile_id: string;
  serving_role_id: string;
  division_serving_roles: {
    id: string;
    name: string;
  } | null;
};

const defaultCategories = [
  "Sunday Service",
  "Youth",
  "Teens",
  "Midweek",
  "Special Service",
  "Training",
  "Other",
];

const productionRows = [
  "Head Production",
  "ProPresenter",
  "Resolume",
  "PowerPoint",
  "Mixer",
  "Cam 1",
  "Cam 2",
  "Cam 3",
  "Cam 4",
  "Cam 5",
  "Cam 6",
  "Cam 7",
  "Cam 8",
  "Foto",
  "Foto 2",
  "Technician",
];

function firstRelation<T>(value: RelationArray<T> | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeColumn(
  label = "Session",
  startTime: string | null = null,
  date: string | null = null
): BuilderColumn {
  return {
    id: makeId(),
    label,
    date,
    start_time: startTime,
    end_time: null,
  };
}

function makeCell(): BuilderCell {
  return {
    display_name: "",
    profile_id: null,
    email: null,
  };
}

function makeRows(labels: string[], columns: BuilderColumn[]): BuilderRow[] {
  return labels.map((label) => ({
    id: makeId(),
    label,
    serving_role_id: null,
    cells: columns.map(() => makeCell()),
  }));
}

function formatDateTitle(dateString: string) {
  if (!dateString) return "Tanggal";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
  });
}

function formatColumnDateLabel(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
  });
}

function formatMonthTitle(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function buildMonthlyDateColumns(firstDate?: string): BuilderColumn[] {
  if (!firstDate) {
    return [
      makeColumn("Minggu 1", null),
      makeColumn("Minggu 2", null),
      makeColumn("Minggu 3", null),
      makeColumn("Minggu 4", null),
    ];
  }

  const startDate = new Date(`${firstDate}T00:00:00`);
  const targetMonth = startDate.getMonth();
  const columns: BuilderColumn[] = [];
  const current = new Date(startDate);

  while (current.getMonth() === targetMonth) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateValue = `${yyyy}-${mm}-${dd}`;

    columns.push({
      id: makeId(),
      label: formatColumnDateLabel(current),
      date: dateValue,
      start_time: null,
      end_time: null,
    });

    current.setDate(current.getDate() + 7);
  }

  return columns.length > 0
    ? columns
    : [
        makeColumn("Minggu 1", null),
        makeColumn("Minggu 2", null),
        makeColumn("Minggu 3", null),
        makeColumn("Minggu 4", null),
      ];
}

function buildDefaultGroup(mode: ScheduleMode): BuilderGroup {
  if (mode === "SINGLE_SESSION") {
    const columns = [makeColumn("Standby / Pelayan", "08:00")];

    return {
      id: makeId(),
      title: "Single Session",
      date: null,
      note: "",
      columns,
      rows: makeRows(productionRows, columns),
    };
  }

  if (mode === "MONTHLY_MULTI_DATE") {
    const columns = buildMonthlyDateColumns();

    return {
      id: makeId(),
      title: "Monthly Schedule",
      date: null,
      note: "",
      columns,
      rows: makeRows(productionRows, columns),
    };
  }

  const columns = [
    makeColumn("08.00", "08:00"),
    makeColumn("10.00", "10:00"),
    makeColumn("12.00", "12:00"),
    makeColumn("14.00", "14:00"),
    makeColumn("16.00", "16:00"),
    makeColumn("18.00", "18:00"),
  ];

  return {
    id: makeId(),
    title: "Tanggal",
    date: null,
    note: "DILARANG TUKAR TANPA IZIN",
    columns,
    rows: makeRows(productionRows, columns),
  };
}

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "");
}

function isEmptyCellName(value: string) {
  const clean = value.trim();
  return !clean || clean === "-";
}

function splitCellNames(value: string) {
  return value
    .split("/")
    .map((item) => normalizeName(item))
    .filter((item) => item && item !== "-");
}

function normalizeRole(value: string) {
  return value
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z]/g, "");
}

function normalizeDivisionMembers(data: unknown): DivisionMember[] {
  const rows = (data as RawDivisionMember[] | null) ?? [];

  return rows.map((member) => ({
    id: member.id,
    profile_id: member.profile_id,
    role: member.role,
    profiles: firstRelation(member.profiles),
  }));
}

export default function NewSchedulePage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const [churchId, setChurchId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [churchRole, setChurchRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [divisionId, setDivisionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [divisionMembers, setDivisionMembers] = useState<DivisionMember[]>([]);
  const [servingRoles, setServingRoles] = useState<ServingRole[]>([]);
  const [memberServingRoles, setMemberServingRoles] = useState<
    MemberServingRole[]
  >([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("LINK_ONLY");

  const [scheduleMode, setScheduleMode] =
    useState<ScheduleMode>("MULTI_SESSION_BY_DATE");

  const [groups, setGroups] = useState<BuilderGroup[]>([
    buildDefaultGroup("MULTI_SESSION_BY_DATE"),
  ]);

  const [status, setStatus] = useState("");

  const selectedDivision = useMemo(() => {
    return divisions.find((division) => division.id === divisionId);
  }, [divisionId, divisions]);

  const conflictMap = useMemo(() => {
    const result = new Set<string>();

    groups.forEach((group, groupIndex) => {
      group.columns.forEach((column, columnIndex) => {
        const nameToCells = new Map<string, string[]>();

        group.rows.forEach((row, rowIndex) => {
          const cell = row.cells[columnIndex];
          if (!cell || isEmptyCellName(cell.display_name)) return;

          const names = splitCellNames(cell.display_name);

          names.forEach((name) => {
            const key = `${groupIndex}-${rowIndex}-${columnIndex}`;

            if (!nameToCells.has(name)) {
              nameToCells.set(name, []);
            }

            nameToCells.get(name)?.push(key);
          });
        });

        nameToCells.forEach((cellKeys) => {
          if (cellKeys.length > 1) {
            cellKeys.forEach((cellKey) => result.add(cellKey));
          }
        });
      });
    });

    return result;
  }, [groups]);

  const conflictCount = conflictMap.size;

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);

      const access = await getChurchAccess(tenantSlug);

      if (!access.allowed) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      setChurchRole(access.churchRole);
      setIsPlatformAdmin(access.isPlatformAdmin);

      if (!access.profileId || !access.churchId) {
        setRedirecting(true);
        window.location.href = "/dashboard";
        return;
      }

      setChurchId(access.churchId);
      setProfileId(access.profileId);

      const { data: coordinatorData } = await supabase
        .from("division_members")
        .select(
          `
          role,
          divisions (
            id,
            name,
            slug
          )
        `
        )
        .eq("church_id", access.churchId)
        .eq("profile_id", access.profileId)
        .eq("role", "DIVISION_COORDINATOR");

      const coordinatorDivisions =
        coordinatorData
          ?.map((item: any) => firstRelation(item.divisions))
          .filter(Boolean) ?? [];

      const canCreateSchedule =
        access.isPlatformAdmin ||
        access.churchRole === "CHURCH_ADMIN" ||
        coordinatorDivisions.length > 0;

      if (!canCreateSchedule) {
        setRedirecting(true);
        window.location.href = `/church/${tenantSlug}/schedules`;
        return;
      }

      if (access.isPlatformAdmin || access.churchRole === "CHURCH_ADMIN") {
        const { data: divisionsData } = await supabase
          .from("divisions")
          .select("id, name, slug")
          .eq("church_id", access.churchId)
          .order("name");

        setDivisions((divisionsData as Division[] | null) ?? []);
      } else {
        setDivisions(coordinatorDivisions as Division[]);
      }

      setPageLoading(false);
    };

    if (tenantSlug) load();
  }, [tenantSlug]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!divisionId || !churchId) {
        setCategories([]);
        setCategoryId("");
        return;
      }

      const { data: existingCategories } = await supabase
        .from("schedule_categories")
        .select("id, name")
        .eq("division_id", divisionId)
        .order("name");

      if (!existingCategories || existingCategories.length === 0) {
        const inserts = defaultCategories.map((name) => ({
          church_id: churchId,
          division_id: divisionId,
          name,
          created_by: profileId || null,
        }));

        await supabase.from("schedule_categories").insert(inserts);

        const { data: freshCategories } = await supabase
          .from("schedule_categories")
          .select("id, name")
          .eq("division_id", divisionId)
          .order("name");

        setCategories((freshCategories as Category[] | null) ?? []);
        return;
      }

      setCategories((existingCategories as Category[] | null) ?? []);
    };

    loadCategories();
  }, [divisionId, churchId, profileId]);

  useEffect(() => {
    const loadDivisionPeople = async () => {
      if (!divisionId) {
        setDivisionMembers([]);
        setServingRoles([]);
        setMemberServingRoles([]);
        return;
      }

      const { data: membersData } = await supabase
        .from("division_members")
        .select(
          `
          id,
          profile_id,
          role,
          profiles (
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("division_id", divisionId)
        .order("role");

      setDivisionMembers(normalizeDivisionMembers(membersData));

      const { data: servingRolesData } = await supabase
        .from("division_serving_roles")
        .select("id, name, description")
        .eq("division_id", divisionId)
        .order("name");

      setServingRoles((servingRolesData as unknown as ServingRole[]) ?? []);

      const { data: memberRolesData } = await supabase
        .from("member_serving_roles")
        .select(
          `
          id,
          profile_id,
          serving_role_id,
          division_serving_roles (
            id,
            name
          )
        `
        )
        .eq("division_id", divisionId);

      setMemberServingRoles(
        (memberRolesData as unknown as MemberServingRole[]) ?? []
      );
    };

    loadDivisionPeople();
  }, [divisionId]);

  const getSuggestedMembersForRow = (rowLabel: string): Profile[] => {
    const rowRoleKey = normalizeRole(rowLabel);

    const matchedServingRoles = servingRoles.filter((role) => {
      const roleKey = normalizeRole(role.name);
      return (
        roleKey === rowRoleKey ||
        roleKey.includes(rowRoleKey) ||
        rowRoleKey.includes(roleKey)
      );
    });

    const matchedRoleIds = matchedServingRoles.map((role) => role.id);

    if (matchedRoleIds.length === 0) {
      return divisionMembers
        .map((member) => member.profiles)
        .filter((profile): profile is Profile => Boolean(profile))
        .slice(0, 8);
    }

    const allowedProfileIds = memberServingRoles
      .filter((item) => matchedRoleIds.includes(item.serving_role_id))
      .map((item) => item.profile_id);

    const uniqueProfileIds = Array.from(new Set(allowedProfileIds));

    return uniqueProfileIds
      .map((targetProfileId) => {
        return divisionMembers.find(
          (member) => member.profile_id === targetProfileId
        )?.profiles;
      })
      .filter((profile): profile is Profile => Boolean(profile));
  };

  const applySuggestedMember = (
    groupIndex: number,
    rowIndex: number,
    cellIndex: number,
    profile: Profile | null | undefined
  ) => {
    if (!profile) return;

    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];
      const rows = [...group.rows];
      const cells = [...rows[rowIndex].cells];

      cells[cellIndex] = {
        ...cells[cellIndex],
        display_name: profile.name || profile.email,
        profile_id: profile.id,
        email: profile.email,
      };

      rows[rowIndex] = {
        ...rows[rowIndex],
        cells,
      };

      next[groupIndex] = {
        ...group,
        rows,
      };

      return next;
    });
  };

  const handleModeChange = (mode: ScheduleMode) => {
    const confirmed = window.confirm(
      "Ganti template akan mereset builder table. Lanjutkan?"
    );

    if (!confirmed) return;

    setScheduleMode(mode);
    setGroups([buildDefaultGroup(mode)]);
  };

  const createCategoryIfNeeded = async () => {
    if (!newCategoryName.trim()) return categoryId || null;
    if (!churchId || !divisionId) return categoryId || null;

    const { data, error } = await supabase
      .from("schedule_categories")
      .insert({
        church_id: churchId,
        division_id: divisionId,
        name: newCategoryName.trim(),
        created_by: profileId || null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return data.id;
  };

  const generateShareSlug = () => {
    const base = `${selectedDivision?.slug ?? "schedule"}-${title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const random = Math.random().toString(36).slice(2, 7);
    return `${base}-${random}`;
  };

  const updateGroup = (
    groupIndex: number,
    field: keyof BuilderGroup,
    value: any
  ) => {
    setGroups((current) => {
      const next = [...current];
      next[groupIndex] = {
        ...next[groupIndex],
        [field]: value,
      };

      return next;
    });
  };

  const updateGroupDate = (groupIndex: number, value: string) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];

      if (scheduleMode === "MONTHLY_MULTI_DATE") {
        const columns = buildMonthlyDateColumns(value);

        next[groupIndex] = {
          ...group,
          date: value,
          title: formatMonthTitle(value),
          columns,
          rows: group.rows.map((row) => ({
            ...row,
            cells: columns.map((_, index) => row.cells[index] ?? makeCell()),
          })),
        };

        return next;
      }

      next[groupIndex] = {
        ...group,
        date: value,
        title:
          group.title === "Tanggal" ||
          group.title === "Monthly Schedule" ||
          group.title === "Single Session" ||
          group.title.startsWith("Minggu")
            ? formatDateTitle(value)
            : group.title,
      };

      return next;
    });
  };

  const addGroup = () => {
    setGroups((current) => [
      ...current,
      {
        ...buildDefaultGroup(scheduleMode),
        title: `Group ${current.length + 1}`,
      },
    ]);
  };

  const duplicateGroup = (groupIndex: number) => {
    setGroups((current) => {
      const source = current[groupIndex];

      const duplicated: BuilderGroup = {
        ...source,
        id: makeId(),
        title: `${source.title} Copy`,
        columns: source.columns.map((column) => ({
          ...column,
          id: makeId(),
        })),
        rows: source.rows.map((row) => ({
          ...row,
          id: makeId(),
          cells: row.cells.map((cell) => ({ ...cell })),
        })),
      };

      return [...current, duplicated];
    });
  };

  const removeGroup = (groupIndex: number) => {
    if (groups.length <= 1) {
      setStatus("Minimal harus ada 1 group jadwal.");
      return;
    }

    setGroups((current) => current.filter((_, index) => index !== groupIndex));
  };

  const addColumn = (groupIndex: number) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];

      const newColumn = makeColumn(`Column ${group.columns.length + 1}`, null);

      next[groupIndex] = {
        ...group,
        columns: [...group.columns, newColumn],
        rows: group.rows.map((row) => ({
          ...row,
          cells: [...row.cells, makeCell()],
        })),
      };

      return next;
    });
  };

  const removeColumn = (groupIndex: number, columnIndex: number) => {
    const group = groups[groupIndex];

    if (group.columns.length <= 1) {
      setStatus("Minimal harus ada 1 column.");
      return;
    }

    setGroups((current) => {
      const next = [...current];
      const target = next[groupIndex];

      next[groupIndex] = {
        ...target,
        columns: target.columns.filter((_, index) => index !== columnIndex),
        rows: target.rows.map((row) => ({
          ...row,
          cells: row.cells.filter((_, index) => index !== columnIndex),
        })),
      };

      return next;
    });
  };

  const moveColumn = (
    groupIndex: number,
    columnIndex: number,
    direction: "left" | "right"
  ) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];
      const targetIndex =
        direction === "left" ? columnIndex - 1 : columnIndex + 1;

      if (targetIndex < 0 || targetIndex >= group.columns.length) {
        return current;
      }

      const columns = [...group.columns];
      [columns[columnIndex], columns[targetIndex]] = [
        columns[targetIndex],
        columns[columnIndex],
      ];

      const rows = group.rows.map((row) => {
        const cells = [...row.cells];
        [cells[columnIndex], cells[targetIndex]] = [
          cells[targetIndex],
          cells[columnIndex],
        ];

        return {
          ...row,
          cells,
        };
      });

      next[groupIndex] = {
        ...group,
        columns,
        rows,
      };

      return next;
    });
  };

  const updateColumn = (
    groupIndex: number,
    columnIndex: number,
    field: keyof BuilderColumn,
    value: string
  ) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];
      const columns = [...group.columns];

      columns[columnIndex] = {
        ...columns[columnIndex],
        [field]: value,
      };

      next[groupIndex] = {
        ...group,
        columns,
      };

      return next;
    });
  };

  const updateColumnDate = (
    groupIndex: number,
    columnIndex: number,
    value: string
  ) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];
      const columns = [...group.columns];

      columns[columnIndex] = {
        ...columns[columnIndex],
        date: value || null,
        label:
          scheduleMode === "MONTHLY_MULTI_DATE" && value
            ? formatColumnDateLabel(new Date(`${value}T00:00:00`))
            : columns[columnIndex].label,
      };

      next[groupIndex] = {
        ...group,
        columns,
      };

      return next;
    });
  };

  const addRow = (groupIndex: number) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];

      next[groupIndex] = {
        ...group,
        rows: [
          ...group.rows,
          {
            id: makeId(),
            label: "Role Baru",
            serving_role_id: null,
            cells: group.columns.map(() => makeCell()),
          },
        ],
      };

      return next;
    });
  };

  const removeRow = (groupIndex: number, rowIndex: number) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];

      next[groupIndex] = {
        ...group,
        rows: group.rows.filter((_, index) => index !== rowIndex),
      };

      return next;
    });
  };

  const moveRow = (
    groupIndex: number,
    rowIndex: number,
    direction: "up" | "down"
  ) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];
      const targetIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;

      if (targetIndex < 0 || targetIndex >= group.rows.length) return current;

      const rows = [...group.rows];

      [rows[rowIndex], rows[targetIndex]] = [
        rows[targetIndex],
        rows[rowIndex],
      ];

      next[groupIndex] = {
        ...group,
        rows,
      };

      return next;
    });
  };

  const updateRowLabel = (
    groupIndex: number,
    rowIndex: number,
    value: string
  ) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];
      const rows = [...group.rows];

      rows[rowIndex] = {
        ...rows[rowIndex],
        label: value,
      };

      next[groupIndex] = {
        ...group,
        rows,
      };

      return next;
    });
  };

  const updateCell = (
    groupIndex: number,
    rowIndex: number,
    cellIndex: number,
    value: string
  ) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];
      const rows = [...group.rows];
      const cells = [...rows[rowIndex].cells];

      cells[cellIndex] = {
        ...cells[cellIndex],
        display_name: value,
        profile_id: null,
        email: null,
      };

      rows[rowIndex] = {
        ...rows[rowIndex],
        cells,
      };

      next[groupIndex] = {
        ...group,
        rows,
      };

      return next;
    });
  };

  const fillEmptyCellsWithDash = (groupIndex: number) => {
    setGroups((current) => {
      const next = [...current];
      const group = next[groupIndex];

      next[groupIndex] = {
        ...group,
        rows: group.rows.map((row) => ({
          ...row,
          cells: row.cells.map((cell) => ({
            ...cell,
            display_name: cell.display_name.trim() ? cell.display_name : "-",
          })),
        })),
      };

      return next;
    });
  };

  const createSchedule = async () => {
    if (!churchId || !divisionId || !title) {
      setStatus("Lengkapi judul jadwal dan divisi.");
      return;
    }

    if (groups.length === 0) {
      setStatus("Minimal harus ada 1 group jadwal.");
      return;
    }

    if (conflictCount > 0) {
      setStatus(
        `Ada ${conflictCount} cell konflik. Satu orang tidak boleh masuk di lebih dari satu role pada sesi/jam yang sama.`
      );
      return;
    }

    setLoading(true);
    setStatus("Membuat jadwal...");

    try {
      const finalCategoryId = await createCategoryIfNeeded();

      const tableJson = {
        mode: scheduleMode,
        groups,
      };

      const { error } = await supabase.from("schedules").insert({
        church_id: churchId,
        division_id: divisionId,
        category_id: finalCategoryId,
        title,
        description,
        schedule_type: scheduleMode,
        visibility,
        share_slug: generateShareSlug(),
        table_json: tableJson,
        created_by: profileId || null,
      });

      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }

      setStatus("Jadwal berhasil dibuat.");
      window.location.href = `/church/${tenantSlug}/schedules`;
    } catch (error: any) {
      setStatus(error.message ?? "Terjadi error saat membuat jadwal.");
      setLoading(false);
    }
  };

  if (pageLoading || redirecting) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <AppNavbar
          mode="church"
          tenantSlug={tenantSlug}
          isPlatformAdmin={isPlatformAdmin}
          churchRole={churchRole}
        />

        <div className="mx-auto flex h-[70vh] items-center justify-center px-8 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
          {redirecting ? "Redirecting..." : "Loading Workspace..."}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-500/20">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-full bg-gradient-to-b from-blue-100/70 to-transparent blur-3xl" />

      <AppNavbar
        mode="church"
        tenantSlug={tenantSlug}
        isPlatformAdmin={isPlatformAdmin}
        churchRole={churchRole}
      />

      <section className="relative z-10 px-6 py-10 pb-32 md:px-10">
        <div className="mx-auto max-w-[1800px]">
          <a
            href={`/church/${tenantSlug}/schedules`}
            className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition hover:text-blue-600"
          >
            <span className="text-lg leading-none">←</span> Back to Schedules
          </a>

          <div className="mb-10 grid gap-8 xl:grid-cols-[1fr_2fr]">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-blue-600">
                Workspace
              </p>

              <h1 className="text-4xl font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-6xl">
                Schedule
                <br />
                Builder.
              </h1>

              <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                Isi jadwal pelayanan dengan cepat. Sistem memberi rekomendasi
                nama berdasarkan role dan mendeteksi konflik secara real-time.
              </p>

              {conflictCount > 0 && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <p className="text-sm font-black text-red-700">
                    ⚠️ {conflictCount} konflik ditemukan
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6 text-red-600">
                    Ada nama yang masuk lebih dari satu role pada sesi yang
                    sama. Perbaiki cell merah sebelum menyimpan.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-xl md:p-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <Field label="Judul Jadwal">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Contoh: Jadwal Produksi - Mei 2026"
                    className="input-soft"
                  />
                </Field>

                <Field label="Divisi">
                  <select
                    value={divisionId}
                    onChange={(event) => {
                      setDivisionId(event.target.value);
                      setCategoryId("");
                    }}
                    className="input-soft"
                  >
                    <option value="">Pilih divisi...</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Kategori Jadwal">
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="input-soft"
                  >
                    <option value="">Tanpa kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Kategori Baru / Optional">
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Ketik untuk tambah kategori..."
                    className="input-soft"
                  />
                </Field>

                <Field label="Tipe Template">
                  <select
                    value={scheduleMode}
                    onChange={(event) =>
                      handleModeChange(event.target.value as ScheduleMode)
                    }
                    className="input-soft"
                  >
                    <option value="MULTI_SESSION_BY_DATE">
                      Multi Session By Date
                    </option>
                    <option value="MONTHLY_MULTI_DATE">
                      Monthly Multi Date
                    </option>
                    <option value="SINGLE_SESSION">Single Session</option>
                  </select>
                </Field>

                <Field label="Visibility">
                  <select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                    className="input-soft"
                  >
                    <option value="LINK_ONLY">Link Only</option>
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </Field>
              </div>

              <div className="mt-6">
                <Field label="Deskripsi / Optional">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Instruksi khusus atau catatan untuk tim..."
                    className="input-soft min-h-[84px] resize-none"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-blue-600">
                Table Editor
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Custom Schedule Table
              </h2>
            </div>

            <button
              type="button"
              onClick={addGroup}
              className="rounded-full bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-slate-300/60 transition hover:-translate-y-0.5 hover:bg-blue-600"
            >
              + Add Group
            </button>
          </div>

          <div className="grid gap-8">
            {groups.map((group, groupIndex) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70"
              >
                <div className="border-b border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid flex-1 gap-4 md:grid-cols-[260px_190px_1fr]">
                      <input
                        value={group.title}
                        onChange={(event) =>
                          updateGroup(groupIndex, "title", event.target.value)
                        }
                        placeholder="Nama Group"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                      <input
                        value={group.date ?? ""}
                        onChange={(event) =>
                          updateGroupDate(groupIndex, event.target.value)
                        }
                        type="date"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />

                      <input
                        value={group.note}
                        onChange={(event) =>
                          updateGroup(groupIndex, "note", event.target.value)
                        }
                        placeholder="Catatan group / optional..."
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addColumn(groupIndex)}
                        className="action-btn-light"
                      >
                        + Col
                      </button>

                      <button
                        type="button"
                        onClick={() => addRow(groupIndex)}
                        className="action-btn-light"
                      >
                        + Row
                      </button>

                      <button
                        type="button"
                        onClick={() => fillEmptyCellsWithDash(groupIndex)}
                        className="action-btn-light"
                      >
                        Fill -
                      </button>

                      <div className="mx-1 h-5 w-px bg-slate-200" />

                      <button
                        type="button"
                        onClick={() => duplicateGroup(groupIndex)}
                        className="action-btn-light"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => removeGroup(groupIndex)}
                        className="action-btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto p-5">
                  <table
                    className="table-fixed border-separate border-spacing-1 text-sm"
                    style={{
                      minWidth: `${250 + group.columns.length * 200 + 80}px`,
                    }}
                  >
                    <thead>
                      <tr>
                        <th className="w-[250px] rounded-xl bg-slate-950 px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-white">
                          Role Pelayanan
                        </th>

                        {group.columns.map((column, columnIndex) => (
                          <th
                            key={column.id}
                            className="w-[200px] rounded-xl bg-slate-950 px-2 py-2 text-center"
                          >
                            <div className="mb-2 flex items-center justify-between px-2">
                              <button
                                type="button"
                                onClick={() =>
                                  moveColumn(groupIndex, columnIndex, "left")
                                }
                                className="column-control"
                                title="Move left"
                              >
                                ←
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeColumn(groupIndex, columnIndex)
                                }
                                className="column-control-danger"
                                title="Remove column"
                              >
                                ×
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  moveColumn(groupIndex, columnIndex, "right")
                                }
                                className="column-control"
                                title="Move right"
                              >
                                →
                              </button>
                            </div>

                            <input
                              value={column.label}
                              onChange={(event) =>
                                updateColumn(
                                  groupIndex,
                                  columnIndex,
                                  "label",
                                  event.target.value
                                )
                              }
                              placeholder="Label sesi"
                              className="mb-2 w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-center text-sm font-black text-white outline-none transition placeholder:text-white/40 focus:border-blue-400 focus:bg-white/15"
                            />

                            {scheduleMode === "MONTHLY_MULTI_DATE" ? (
                              <input
                                value={column.date ?? ""}
                                onChange={(event) =>
                                  updateColumnDate(
                                    groupIndex,
                                    columnIndex,
                                    event.target.value
                                  )
                                }
                                type="date"
                                className="mx-auto block w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-center text-xs font-bold text-white/80 outline-none transition focus:border-blue-400"
                              />
                            ) : (
                              <input
                                value={column.start_time ?? ""}
                                onChange={(event) =>
                                  updateColumn(
                                    groupIndex,
                                    columnIndex,
                                    "start_time",
                                    event.target.value
                                  )
                                }
                                type="time"
                                className="mx-auto block w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-center text-xs font-bold text-white/80 outline-none transition focus:border-blue-400"
                              />
                            )}
                          </th>
                        ))}

                        <th className="w-[80px]" />
                      </tr>
                    </thead>

                    <tbody>
                      {group.rows.map((row, rowIndex) => {
                        const suggestedMembers = getSuggestedMembersForRow(
                          row.label
                        );

                        return (
                          <tr key={row.id} className="group/row">
                            <td className="w-[250px] p-1">
                              <input
                                value={row.label}
                                onChange={(event) =>
                                  updateRowLabel(
                                    groupIndex,
                                    rowIndex,
                                    event.target.value
                                  )
                                }
                                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                              />
                            </td>

                            {row.cells.map((cell, cellIndex) => {
                              const conflictKey = `${groupIndex}-${rowIndex}-${cellIndex}`;
                              const isConflict = conflictMap.has(conflictKey);

                              return (
                                <td
                                  key={cellIndex}
                                  className="relative w-[200px] p-1"
                                >
                                  <div
                                    className={`relative h-12 rounded-xl border transition-all ${
                                      isConflict
                                        ? "conflict-glow border-red-400 bg-red-50"
                                        : "border-slate-200 bg-slate-50 hover:border-slate-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10"
                                    }`}
                                  >
                                    <input
                                      value={cell.display_name}
                                      onChange={(event) =>
                                        updateCell(
                                          groupIndex,
                                          rowIndex,
                                          cellIndex,
                                          event.target.value
                                        )
                                      }
                                      placeholder="-"
                                      className={`h-full w-full bg-transparent px-3 text-center text-sm font-black outline-none transition ${
                                        isConflict
                                          ? "text-red-600"
                                          : "text-slate-800"
                                      }`}
                                    />
                                  </div>

                                  {suggestedMembers.length > 0 &&
                                    !cell.display_name && (
                                      <div className="absolute left-0 top-[105%] z-10 flex w-full flex-wrap justify-center gap-1 opacity-0 transition-opacity group-focus-within/row:opacity-100 hover:opacity-100">
                                        {suggestedMembers
                                          .slice(0, 3)
                                          .map((profile) => (
                                            <button
                                              key={profile.id}
                                              type="button"
                                              onClick={() =>
                                                applySuggestedMember(
                                                  groupIndex,
                                                  rowIndex,
                                                  cellIndex,
                                                  profile
                                                )
                                              }
                                              className="rounded-lg border border-blue-100 bg-white px-2 py-1 text-[10px] font-black text-blue-600 shadow-lg shadow-slate-200/70 hover:bg-blue-600 hover:text-white"
                                              title={profile.email}
                                            >
                                              {(
                                                profile.name ||
                                                profile.email ||
                                                "?"
                                              )
                                                .split(" ")[0]
                                                .slice(0, 10)}
                                            </button>
                                          ))}
                                      </div>
                                    )}
                                </td>
                              );
                            })}

                            <td className="w-[80px] p-1 text-center opacity-0 transition-opacity group-hover/row:opacity-100">
                              <div className="flex justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    moveRow(groupIndex, rowIndex, "up")
                                  }
                                  className="row-control"
                                  title="Move up"
                                >
                                  ↑
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    moveRow(groupIndex, rowIndex, "down")
                                  }
                                  className="row-control"
                                  title="Move down"
                                >
                                  ↓
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeRow(groupIndex, rowIndex)
                                  }
                                  className="row-control-danger"
                                  title="Delete row"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white/85 p-4 shadow-2xl shadow-slate-300/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-2 md:px-6">
          <p className="hidden text-sm font-bold text-slate-500 md:block">
            {status || "Pastikan jadwal sudah benar sebelum menyimpan."}
          </p>

          <button
            type="button"
            onClick={createSchedule}
            disabled={loading || conflictCount > 0}
            className="w-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          >
            {loading
              ? "Menyimpan..."
              : conflictCount > 0
              ? "⚠️ Selesaikan Konflik"
              : "Simpan Jadwal →"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-soft {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.9rem 1rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: rgb(15 23 42);
          outline: none;
          transition: all 0.2s ease;
        }

        .input-soft:focus {
          border-color: rgb(37 99 235);
          background: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .input-soft::placeholder {
          color: rgb(148 163 184);
        }

        .action-btn-light {
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.55rem 0.85rem;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgb(71 85 105);
          transition: all 0.18s ease;
        }

        .action-btn-light:hover {
          border-color: rgb(37 99 235);
          color: rgb(37 99 235);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.1);
        }

        .action-btn-danger {
          border-radius: 0.75rem;
          border: 1px solid rgb(254 202 202);
          background: white;
          padding: 0.55rem 0.85rem;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgb(220 38 38);
          transition: all 0.18s ease;
        }

        .action-btn-danger:hover {
          background: rgb(220 38 38);
          color: white;
        }

        .column-control {
          height: 1.65rem;
          min-width: 1.65rem;
          border-radius: 0.5rem;
          color: rgba(255, 255, 255, 0.68);
          font-size: 0.75rem;
          font-weight: 900;
          transition: all 0.15s ease;
        }

        .column-control:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
        }

        .column-control-danger {
          height: 1.65rem;
          min-width: 1.65rem;
          border-radius: 0.5rem;
          color: rgba(255, 255, 255, 0.58);
          font-size: 1rem;
          font-weight: 900;
          transition: all 0.15s ease;
        }

        .column-control-danger:hover {
          background: rgba(239, 68, 68, 0.15);
          color: rgb(248 113 113);
        }

        .row-control {
          height: 1.65rem;
          min-width: 1.65rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(100 116 139);
          font-size: 0.72rem;
          font-weight: 900;
          transition: all 0.15s ease;
        }

        .row-control:hover {
          border-color: rgb(37 99 235);
          color: rgb(37 99 235);
        }

        .row-control-danger {
          height: 1.65rem;
          min-width: 1.65rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(254 202 202);
          background: white;
          color: rgb(220 38 38);
          font-size: 0.85rem;
          font-weight: 900;
          transition: all 0.15s ease;
        }

        .row-control-danger:hover {
          background: rgb(220 38 38);
          color: white;
        }

        .conflict-glow {
          animation: pulse-red 1.45s infinite;
        }

        @keyframes pulse-red {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.38);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}