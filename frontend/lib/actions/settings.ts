'use server';

import { DEFAULT_PLATFORM_NAME } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export interface PublicPlatformSettings {
  platformName: string;
  schoolName: string;
  allowAllGradesAccess: boolean;
}

export async function getPlatformName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('platform_name')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_PLATFORM_NAME;
    }

    return data.platform_name || DEFAULT_PLATFORM_NAME;
  } catch {
    return DEFAULT_PLATFORM_NAME;
  }
}

export async function getPublicPlatformSettings(): Promise<PublicPlatformSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('platform_name, school_name, allow_all_grades_access')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return {
        platformName: DEFAULT_PLATFORM_NAME,
        schoolName: '',
        allowAllGradesAccess: false,
      };
    }

    return {
      platformName: data.platform_name || DEFAULT_PLATFORM_NAME,
      schoolName: (data as any).school_name || '',
      allowAllGradesAccess: !!data.allow_all_grades_access,
    };
  } catch {
    return {
      platformName: DEFAULT_PLATFORM_NAME,
      schoolName: '',
      allowAllGradesAccess: false,
    };
  }
}

export async function getSubjectsList(): Promise<Array<{ id: string; name: string }>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((s) => ({ id: String(s.id), name: s.name }));
  } catch {
    return [];
  }
}

