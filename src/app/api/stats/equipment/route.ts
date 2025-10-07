// app/api/stats/equipment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

type EquipmentStatus =
	| 'actif'
	| 'en_maintenance'
	| 'obsolete'
	| 'bientot_obsolete'
	| 'retire'
	| string;

interface EquipmentStatsRow {
	client_id: string | null;
	status: EquipmentStatus | null;
	type_id: string | null;
	type_name: string | null;
	type_code: string | null;
	cost: number | null;
}

// GET /api/stats/equipment - Statistiques des équipements
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json(
				{ message: 'Non authentifié' },
				{ status: 401 }
			);
		}

		const supabase = createSupabaseServerClient();
		const checker = new PermissionChecker(user);
		const { searchParams } = new URL(request.url);

		const clientId = searchParams.get('client_id');
		const statusFilter = searchParams.get('status');
		const typeId = searchParams.get('type_id');
		const typeCode = searchParams.get('type_code');
		const legacyType = searchParams.get('type');

		if (!checker.canViewAllData() && clientId && clientId !== user.client_id) {
			return NextResponse.json(
				{ message: 'Vous ne pouvez pas accéder aux statistiques d\'un autre client' },
				{ status: 403 }
			);
		}

		const canAccessStats = checker.can('read', 'reports', { client_id: user.client_id });
		if (!canAccessStats) {
			return NextResponse.json(
				{ message: 'Permissions insuffisantes pour accéder aux statistiques' },
				{ status: 403 }
			);
		}

		let query = supabase
			.from('v_equipment_with_client')
			.select('client_id, status, type_id, type_name, type_code, cost');

		if (!checker.canViewAllData() && user.client_id) {
			query = query.eq('client_id', user.client_id);
		} else if (clientId) {
			query = query.eq('client_id', clientId);
		}

		if (statusFilter) {
			query = query.eq('status', statusFilter);
		}

		if (typeId) {
			query = query.eq('type_id', typeId);
		} else if (typeCode) {
			query = query.eq('type_code', typeCode);
		} else if (legacyType) {
			query = query.ilike('type_code', `%${legacyType}%`);
		}

		const { data, error } = await query;

		if (error) {
			console.error('Erreur lors de la récupération des statistiques équipements:', error);
			return NextResponse.json(
				{ message: 'Erreur lors de la récupération des statistiques' },
				{ status: 500 }
			);
		}

		const equipment: EquipmentStatsRow[] = (data ?? []) as EquipmentStatsRow[];
		const validEquipment = equipment.filter(
			(item) => (item.type_name || item.type_code) && item.status,
		);

		if (!validEquipment.length) {
			return NextResponse.json({
				total: 0,
				by_type: {},
				by_status: {},
				total_value: 0,
				chart_data: {
					types: [],
					statuses: [],
				},
				filters: buildFiltersPayload({
					clientId,
					status: statusFilter,
					typeId,
					typeCode,
					legacyType,
				}),
			});
		}

		const totalValue = validEquipment.reduce((sum, item) => sum + (item.cost ?? 0), 0);

		const byType = validEquipment.reduce<Record<string, number>>((acc, item) => {
			const key = item.type_name ?? item.type_code ?? 'Inconnu';
			acc[key] = (acc[key] ?? 0) + 1;
			return acc;
		}, {});

		const byStatus = validEquipment.reduce<Record<string, number>>((acc, item) => {
			const key = item.status ?? 'inconnu';
			acc[key] = (acc[key] ?? 0) + 1;
			return acc;
		}, {});

		const chartData = {
			types: Object.entries(byType).map(([name, value]) => ({
				name,
				value,
				percentage: percentage(value, validEquipment.length),
			})),
			statuses: Object.entries(byStatus).map(([name, value]) => ({
				name,
				value,
				percentage: percentage(value, validEquipment.length),
			})),
		};

		return NextResponse.json({
			total: validEquipment.length,
			by_type: byType,
			by_status: byStatus,
			total_value: totalValue,
			chart_data: chartData,
			filters: buildFiltersPayload({
				clientId,
				status: statusFilter,
				typeId,
				typeCode,
				legacyType,
				firstItem: validEquipment[0],
			}),
		});
	} catch (error) {
		console.error('Erreur API GET /stats/equipment:', error);
		return NextResponse.json(
			{ message: 'Erreur interne du serveur' },
			{ status: 500 }
		);
	}
}

function percentage(value: number, total: number): number {
	return total ? Math.round((value / total) * 100) : 0;
}

function buildFiltersPayload(params: {
	clientId: string | null;
	status: string | null;
	typeId: string | null;
	typeCode: string | null;
	legacyType: string | null;
	firstItem?: EquipmentStatsRow;
}): Record<string, string | null> {
	const { clientId, status, typeId, typeCode, legacyType, firstItem } = params;
	const typeLabel =
		typeCode ??
		firstItem?.type_name ??
		firstItem?.type_code ??
		legacyType ??
		typeId ??
		null;

	return {
		clientId,
		status,
		type: typeLabel,
	};
}