import type {APIRoute} from "astro";
import {db} from '@/db'
import {processStages} from "@/db/schema/process-stages.schema";
import {eq, and} from "drizzle-orm";
import {createStageSchema} from "@/lib/validations";
import {ilikeUnaccent} from "@/lib/search";
import {slugify} from "@/lib/slug";

export const GET: APIRoute = async ({url}) => {
	try {
		const q = url.searchParams.get('q');
		const conditions = [];

		if (q) {
			conditions.push(ilikeUnaccent(processStages.name, `%${q}%`));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const result = await db
			.select({
				id: processStages.id,
				name: processStages.name,
				slug: processStages.slug,
			})
			.from(processStages)
			.where(where)

		return new Response(
			JSON.stringify(result),
			{status: 200, headers: {"Content-Type": "application/json"}}
		)


	} catch (error) {
		console.error("Error en GET /api/stages:", error);
		return new Response(
			JSON.stringify({error: "Error interno del servidor"}),
			{status: 500, headers: {"Content-Type": "application/json"}}
		);
	}
};

export const POST: APIRoute = async ({request}) => {
	try {
		const body = await request.json();
		const parsed = createStageSchema.safeParse(body);

		if (!parsed.success) {
			return new Response(
				JSON.stringify({ error: "Datos inválidos", details: parsed.error.issues }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		const {name} = parsed.data;
		const slug = slugify(name);
		const [existing] = await db
			.select({
				id: processStages.id,
			})
			.from(processStages)
			.where(eq(processStages.slug, slug))

		if (existing) {
			return new Response(
				JSON.stringify({error: "El nombre ya existe", slug}),
				{status: 409, headers: {"Content-Type": "application/json"}}
			);
		}

		const [created] = await db
			.insert(processStages)
			.values({name, slug})
			.returning({id: processStages.id, name: processStages.name, slug: processStages.slug});

		return new Response(
			JSON.stringify(created),
			{status: 201, headers: {"Content-Type": "application/json"}}
		)

	} catch (error) {
		console.error("Error en POST /api/stages:", error);
		return new Response(
			JSON.stringify({error: "Error interno del servidor"}),
			{status: 500, headers: {"Content-Type": "application/json"}}
		);
	}
}