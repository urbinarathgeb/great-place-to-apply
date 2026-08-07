import type {APIRoute} from "astro";
import {db} from "@/db";
import {categories} from "@/db/schema/categories.schema";
import {eq, and} from "drizzle-orm";
import {slugify} from "@/lib/slug";
import {createCategorySchema} from "@/lib/validations";
import {ilikeUnaccent} from "@/lib/search";

export const GET: APIRoute = async ({url}) => {
	try {
		const q = url.searchParams.get('q');
		const conditions = [];

		if (q) {
			conditions.push(ilikeUnaccent(categories.name, `%${q}%`));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const result = await db.select({
			id: categories.id,
			name: categories.name,
			slug: categories.slug,
		})
			.from(categories)
			.where(where)
			.orderBy(categories.name);

		return new Response(
			JSON.stringify(result),
			{
				status: 200,
				headers: {'Content-Type': 'application/json'},
			}
		);

	} catch (error) {
		console.error('Error en GET api/categories', error);
		return new Response(JSON.stringify({error: 'Error interno del servidor'}), {
			status: 500,
			headers: {'Content-Type': 'application/json'},
		});
	}
};

export const POST: APIRoute = async ({request}) => {
	try {
		const body = await request.json();
		const parsed = createCategorySchema.safeParse(body);

		if (!parsed.success) {
			return new Response(
				JSON.stringify({error: 'Faltan datos obligatorios', details: parsed.error.issues}),
				{status: 400, headers: {'Content-Type': 'application/json'}}
			);
		}

		const {name} = parsed.data;
		const slug = slugify(name);

		const [existing] = await db
			.select({
				id: categories.id,
			})
			.from(categories)
			.where(eq(categories.slug, slug))
			.limit(1);

		if (existing) {
			return new Response(JSON.stringify({error: 'Esta categoría ya existe', slug}), {
				status: 409,
				headers: {'Content-Type': 'application/json'},
			});
		}

		const [created] = await db
			.insert(categories)
			.values({name, slug})
			.returning({id: categories.id, name: categories.name, slug: categories.slug});

		return new Response(JSON.stringify(created), {
			status: 201,
			headers: {'Content-Type': 'application/json'},
		});

	} catch (error) {
		console.error('Error en POST api/categories', error);
		return new Response(JSON.stringify({error: 'Error interno del servidor'}), {
			status: 500,
			headers: {'Content-Type': 'application/json'},
		});
	}
};
