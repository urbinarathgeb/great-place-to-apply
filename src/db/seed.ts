import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { categories } from "./schema/categories.schema";
import { companies } from "./schema/companies.schema";
import { processStages } from "./schema/process-stages.schema";
import { reviews } from "./schema/reviews.schema";
import { stageReviews } from "./schema/stage-reviews.schema";
import { aspectRating, ASPECTS } from "./schema/aspect-rating.schema";
import { slugify } from "../lib/slug";

config({ path: ".env.development" });

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

const seedCategories = [
  "Minería",
  "Banca y Finanzas",
  "Retail",
  "Tecnología",
  "Transporte y Logística",
  "Alimentos y Bebidas",
  "Telecomunicaciones",
  "Consumo Masivo",
  "Energía",
  "Salud",
  "Consultoría",
  "Manufactura",
  "Construcción e Inmobiliaria",
  "Entretenimiento y Medios",
  "Educación",
].map((name) => ({ name, slug: slugify(name) }));

const seedStages = [
  // Aplicación
  { name: "Postulación Enviada", slug: "postulacion-enviada" },
  // Entrevistas
  { name: "Screening o primera llamada", slug: "screening-o-primera-llamada" },
  { name: "Entrevista con HR o Reclutador", slug: "entrevista-con-hr-o-reclutador" },
  { name: "Entrevista técnica", slug: "entrevista-tecnica" },
  { name: "Entrevista con el líder del equipo (Hiring Manager)", slug: "entrevista-con-el-lider-del-equipo-hiring-manager" },
  { name: "Entrevista con el equipo o Panel", slug: "entrevista-con-el-equipo-o-panel" },
  { name: "Entrevista con dirección / C-level / CEO", slug: "entrevista-con-direccion-c-level-ceo" },
  // Pruebas y evaluaciones
  { name: "Prueba práctica o caso (take-home)", slug: "evaluacion-o-prueba-practica" },
  { name: "Test psicométrico o aptitudes", slug: "test-psicometrico-o-aptitudes" },
  { name: "Assessment center / dinámica grupal", slug: "assessment-center-dinamica-grupal" },
  // Oferta y cierre
  { name: "Oferta laboral / negociación", slug: "oferta-laboral" },
  { name: "Resultado del proceso", slug: "resultado-del-proceso" },
];

type SeedCompany = {
  name: string;
  categorySlug: string;
  location: string;
  description: string;
  website?: string;
  careersUrl?: string;
};

type SeededCompany = SeedCompany & { slug: string };

const seedCompanies: SeededCompany[] = [
  { name: "Antofagasta Minerals", categorySlug: "mineria", location: "Antofagasta, Chile", description: "Compañía minera de cobre con operaciones en el norte de Chile, líder en la región de Antofagasta." },
  { name: "Codelco", categorySlug: "mineria", location: "Santiago, Chile", description: "Empresa estatal de cobre y la mayor productora del metal a nivel mundial, con faenas a lo largo de todo Chile.", website: "https://www.codelco.com", careersUrl: "https://www.codelco.com/nosotros/recursos-humanos/sistema-de-postulaciones-en-linea" },
  { name: "Anglo American", categorySlug: "mineria", location: "Santiago, Chile", description: "Minería diversificada con operaciones de cobre y la planta de procesamiento de Los Bronces." },
  { name: "BHP", categorySlug: "mineria", location: "Santiago, Chile", description: "Gigante minero global con faenas como Escondida y Cerro Colorado en Chile." },
  { name: "SQM", categorySlug: "mineria", location: "Santiago, Chile", description: "Compañía chilena de litio, yodo y fertilizantes especiales, líder mundial en el Salar de Atacama." },
  { name: "LATAM Airlines", categorySlug: "transporte-y-logistica", location: "Santiago, Chile", description: "Grupo de aerolíneas líder en Sudamérica, conectando más de 140 destinos en el continente.", website: "https://www.latamairlines.com/cl/es", careersUrl: "https://www.latamairlines.com/cl/es/trabaja-con-nosotros" },
  { name: "Banco de Chile", categorySlug: "banca-y-finanzas", location: "Santiago, Chile", description: "Banco tradicional chileno con amplia red de sucursales y foco en banca de personas y empresas.", website: "https://bancochile.cl", careersUrl: "https://www.trabajaenelchile.cl/" },
  { name: "Banco Santander", categorySlug: "banca-y-finanzas", location: "Santiago, Chile", description: "Uno de los bancos más grandes del país, con una fuerte apuesta por la digitalización.", website: "https://www.santander.cl", careersUrl: "https://www.santander.com/es/trabaja-con-nosotros" },
  { name: "BCI", categorySlug: "banca-y-finanzas", location: "Santiago, Chile", description: "Banco chileno fundado en 1937 con presencia en banca personal, empresas y medios de pago.", website: "https://www.bci.cl", careersUrl: "https://bci.trabajando.cl/" },
  { name: "Mercado Libre", categorySlug: "tecnologia", location: "Santiago, Chile", description: "Plataforma líder de e-commerce y fintech de América Latina, con un fuerte hub de ingeniería local.", website: "https://www.mercadolibre.cl", careersUrl: "https://sumate.mercadolibre.com/" },
  { name: "Falabella", categorySlug: "retail", location: "Santiago, Chile", description: "Multitienda y ecosistema financiero, uno de los retailers más grandes de Latinoamérica.", website: "https://www.falabella.com", careersUrl: "https://muevete.falabella.com/" },
  { name: "Cencosud", categorySlug: "retail", location: "Santiago, Chile", description: "Conglomerado de retail con supermercados, tiendas por departamento y centros comerciales." },
  { name: "Entel", categorySlug: "telecomunicaciones", location: "Santiago, Chile", description: "Empresa de telecomunicaciones móviles e internet, líder en conectividad en Chile y Perú.", website: "https://www.entel.cl", careersUrl: "https://entel.trabajando.cl/" },
  { name: "Nestlé", categorySlug: "alimentos-y-bebidas", location: "Santiago, Chile", description: "Multinacional de alimentos con plantas en Chile y un amplio portafolio de marcas." },
  { name: "Coca-Cola", categorySlug: "alimentos-y-bebidas", location: "Santiago, Chile", description: "Compañía de bebidas con operación y embotellado en todo el territorio chileno." },
  { name: "CCU", categorySlug: "alimentos-y-bebidas", location: "Santiago, Chile", description: "Compañía de cervezas, vinos, aguas y bebidas con una fuerte presencia local." },
  { name: "Procter & Gamble", categorySlug: "consumo-masivo", location: "Santiago, Chile", description: "Multinacional de consumo masivo con marcas líderes en higiene y cuidado personal." },
  { name: "Sigdo Koppers", categorySlug: "manufactura", location: "Santiago, Chile", description: "Grupo industrial y de servicios con foco en manufactura y construcción." },
  { name: "Viña Concha y Toro", categorySlug: "alimentos-y-bebidas", location: "Pirque, Chile", description: "La viña más grande de Chile y una de las mayores del mundo en vinos." },
  { name: "Sodimac", categorySlug: "retail", location: "Santiago, Chile", description: "Cadena de mejoramiento del hogar y construcción del grupo Falabella." },
  { name: "Microsoft Chile", categorySlug: "tecnologia", location: "Santiago, Chile", description: "Filial chilena del gigante tecnológico, con foco en nube, IA y transformación digital." },
  { name: "Banco Estado", categorySlug: "banca-y-finanzas", location: "Santiago, Chile", description: "Banco estatal con la mayor cobertura del país y foco en inclusión financiera.", website: "https://www.bancoestado.cl", careersUrl: "https://bancoestado.trabajando.cl/" },
  { name: "Itaú Chile", categorySlug: "banca-y-finanzas", location: "Santiago, Chile", description: "Parte del grupo Itaú Unibanco, con una operación enfocada en banca corporativa y de inversiones.", website: "https://www.itau.cl", careersUrl: "https://itau.trabajando.cl/" },
  { name: "Scotiabank Chile", categorySlug: "banca-y-finanzas", location: "Santiago, Chile", description: "Banco canadiense con fuerte presencia en retail banking y grandes empresas en Chile." },
  { name: "Banco BICE", categorySlug: "banca-y-finanzas", location: "Santiago, Chile", description: "Banco chileno especializado en banca de empresas y crédito corporativo." },
  { name: "Ripley", categorySlug: "retail", location: "Santiago, Chile", description: "Multitienda y banco con presencia física y e-commerce en Chile y Perú." },
  { name: "Paris", categorySlug: "retail", location: "Santiago, Chile", description: "Tienda por departamento del grupo Cencosud, con una fuerte operación online." },
  { name: "Globant", categorySlug: "tecnologia", location: "Santiago, Chile", description: "Multinacional de servicios tecnológicos y transformación digital, con un centro en Santiago." },
  { name: "NTT Data", categorySlug: "tecnologia", location: "Santiago, Chile", description: "Consultora global de TI y servicios de transformación digital con oficinas en Chile." },
  { name: "SKY Airline", categorySlug: "transporte-y-logistica", location: "Santiago, Chile", description: "Aerolínea low cost chilena con operaciones nacionales e internacionales.", website: "https://www.skyairline.com", careersUrl: "https://www.skyairline.com/chile/trabaja-con-nosotros" },
  { name: "JetSMART", categorySlug: "transporte-y-logistica", location: "Santiago, Chile", description: "Aerolínea de bajo costo con base en Santiago y rutas a lo largo de Sudamérica." },
  { name: "Metro de Santiago", categorySlug: "transporte-y-logistica", location: "Santiago, Chile", description: "Empresa de transporte público ferroviario que moviliza a millones de pasajeros a diario.", website: "https://www.metro.cl", careersUrl: "https://metro.trabajando.cl/" },
  { name: "Turbus", categorySlug: "transporte-y-logistica", location: "Santiago, Chile", description: "Empresa de transporte interurbano de pasajeros, la más grande del país." },
  { name: "Agrosuper", categorySlug: "alimentos-y-bebidas", location: "Rancagua, Chile", description: "Productora de alimentos del rubro proteico (pollo, cerdo y salmón) con operaciones nacionales.", website: "https://www.agrosuper.cl" },
  { name: "Carozzi", categorySlug: "alimentos-y-bebidas", location: "Santiago, Chile", description: "Multinacional de alimentos con marcas líderes en pastas, galletas y dulces." },
  { name: "Viña Santa Rita", categorySlug: "alimentos-y-bebidas", location: "Buin, Chile", description: "Viña chilena con más de 140 años de tradición y exportación a más de 70 países." },
  { name: "WOM", categorySlug: "telecomunicaciones", location: "Santiago, Chile", description: "Operador móvil challenger con foco en precios competitivos y cobertura nacional.", website: "https://www.wom.cl", careersUrl: "https://wom.trabajando.cl/" },
  { name: "Movistar Chile", categorySlug: "telecomunicaciones", location: "Santiago, Chile", description: "Operador de telecomunicaciones del grupo Telefónica, con servicios móviles y fijos." },
  { name: "Claro Chile", categorySlug: "telecomunicaciones", location: "Santiago, Chile", description: "Operador móvil del grupo América Móvil con cobertura a lo largo de todo Chile." },
  { name: "Enel Chile", categorySlug: "energia", location: "Santiago, Chile", description: "Generadora y distribuidora de energía del grupo Enel, líder en energías renovables.", website: "https://www.enel.cl" },
  { name: "Colbún", categorySlug: "energia", location: "Santiago, Chile", description: "Generadora de energía eléctrica con un mix hídrico, térmico y renovable." },
  { name: "ENAP", categorySlug: "energia", location: "Valparaíso, Chile", description: "Empresa Nacional del Petróleo, dedicada a la exploración, producción y refinación de hidrocarburos." },
  { name: "Cruz Verde", categorySlug: "salud", location: "Santiago, Chile", description: "Cadena de farmacias con cobertura nacional y servicios de salud digital." },
  { name: "RedSalud", categorySlug: "salud", location: "Santiago, Chile", description: "Red de clínicas y prestadores de salud con presencia en varias regiones del país." },
  { name: "Deloitte", categorySlug: "consultoria", location: "Santiago, Chile", description: "Firma global de auditoría, consultoría y asesoría financiera." },
  { name: "EY", categorySlug: "consultoria", location: "Santiago, Chile", description: "Firma global de auditoría y consultoría con oficinas en Santiago." },
  { name: "CMPC", categorySlug: "manufactura", location: "Santiago, Chile", description: "Grupo forestal y papelero, uno de los mayores del mundo en celulosa." },
  { name: "Arauco", categorySlug: "manufactura", location: "Santiago, Chile", description: "División forestal de Empresas Copec, líder en celulosa y productos de madera." },
  { name: "CAP", categorySlug: "manufactura", location: "Santiago, Chile", description: "Grupo minero-siderúrgico que produce acero y productos de la minería del hierro." },
  { name: "Salfacorp", categorySlug: "construccion-e-inmobiliaria", location: "Santiago, Chile", description: "Grupo de ingeniería y construcción con proyectos en Chile, Perú y Colombia." },
  { name: "Besalco", categorySlug: "construccion-e-inmobiliaria", location: "Santiago, Chile", description: "Empresa de construcción e ingeniería con más de 75 años de historia." },
  { name: "CineHoyts", categorySlug: "entretenimiento-y-medios", location: "Santiago, Chile", description: "Cadena de cines líder en Chile, parte del grupo Cinemark." },
  { name: "Mega", categorySlug: "entretenimiento-y-medios", location: "Santiago, Chile", description: "Canal de televisión chileno, líder en audiencia a nivel nacional." },
  { name: "Duoc UC", categorySlug: "educacion", location: "Santiago, Chile", description: "Institución de educación superior técnica con sedes a lo largo de todo el país.", website: "https://www.duoc.cl", careersUrl: "https://www.duoc.cl/trabaja-con-nosotros" },
  { name: "Universidad de los Andes", categorySlug: "educacion", location: "Santiago, Chile", description: "Universidad privada chilena con foco en investigación y docencia." },
].map((company) => ({ ...company, slug: slugify(company.name) }));

type SeedRating = { aspectName: (typeof ASPECTS)[number]; score: string };
type SeedStage = { stageSlug: string; comment: string; ratings: SeedRating[] };
type SeedReview = {
  companySlug: string;
  role: string;
  recommends: boolean;
  daysAgo: number;
  comment: string;
  stages: SeedStage[];
};

const seedReviews: SeedReview[] = [
  {
    companySlug: "latam-airlines",
    role: "Postulante de Ingeniería",
    recommends: true,
    daysAgo: 6,
    comment: "Proceso ágil y bien estructurado. En menos de un mes pasé por 3 etapas. Recibí feedback en cada etapa y la comunicación fue clara. Recomendado.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "Postulé por LinkedIn y en menos de 48 horas recibí respuesta. El proceso fue ágil y bien comunicado.",
        ratings: [
          { aspectName: "rapidez", score: "5.00" },
          { aspectName: "feedback", score: "4.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista con HR muy agradable. Preguntas enfocadas en experiencia previa y motivaciones. Recibí feedback al día siguiente.",
        ratings: [
          { aspectName: "rapidez", score: "4.50" },
          { aspectName: "feedback", score: "4.50" },
          { aspectName: "trato", score: "5.00" },
        ],
      },
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Evaluación técnica bien estructurada. Me dieron una semana para completar un caso práctico. Recibí retroalimentación detallada.",
        ratings: [
          { aspectName: "rapidez", score: "4.50" },
          { aspectName: "feedback", score: "5.00" },
          { aspectName: "transparencia", score: "5.00" },
        ],
      },
    ],
  },
  {
    companySlug: "latam-airlines",
    role: "Analista de Marketing",
    recommends: true,
    daysAgo: 22,
    comment: "Equipo de reclutamiento muy humano y profesional. La entrevista final fue con la gerente de área y fue una conversación de verdad, no un interrogatorio.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "Postulación directa en el portal corporativo, con confirmación inmediata de recepción.",
        ratings: [
          { aspectName: "rapidez", score: "5.00" },
          { aspectName: "feedback", score: "4.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Conversación cercana y enfocada en cultura. Me contaron el desafío real del cargo y las expectativas del equipo.",
        ratings: [
          { aspectName: "trato", score: "5.00" },
          { aspectName: "transparencia", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "latam-airlines",
    role: "Tripulante de Cabina",
    recommends: true,
    daysAgo: 45,
    comment: "Etapas muy bien organizadas y con fechas respetadas. La simulación de atención al pasajero fue realista y el equipo siempre dio respuestas claras.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista grupal con varias personas. El trato fue cordial y nos explicaron el proceso completo desde el inicio.",
        ratings: [
          { aspectName: "rapidez", score: "4.50" },
          { aspectName: "trato", score: "5.00" },
          { aspectName: "feedback", score: "4.50" },
        ],
      },
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Simulacro de atención al pasajero muy bien diseñado, con retroalimentación constructiva al finalizar.",
        ratings: [
          { aspectName: "rapidez", score: "4.50" },
          { aspectName: "transparencia", score: "4.50" },
          { aspectName: "feedback", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "falabella",
    role: "Vendedor part-time",
    recommends: false,
    daysAgo: 12,
    comment: "Proceso lento y con poca comunicación. Postulé, tuve una entrevista y luego silencio total. Nunca recibí respuesta sobre el resultado.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "Postulación a través de su portal web. Respondieron después de 2 semanas sin previo aviso. Proceso lento.",
        ratings: [
          { aspectName: "rapidez", score: "2.00" },
          { aspectName: "feedback", score: "1.50" },
          { aspectName: "transparencia", score: "2.00" },
        ],
      },
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "La entrevista fue cordial pero sentí que no conocían mi perfil. Quedé en espera y nunca volvieron a contactarme.",
        ratings: [
          { aspectName: "rapidez", score: "2.50" },
          { aspectName: "feedback", score: "1.00" },
          { aspectName: "trato", score: "3.00" },
        ],
      },
    ],
  },
  {
    companySlug: "codelco",
    role: "Ingeniero de Procesos",
    recommends: true,
    daysAgo: 18,
    comment: "Un proceso serio y riguroso, con etapas técnicas profundas. La empresa se toma el tiempo de conocer al postulante y el feedback final fue muy claro.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista inicial con talento humano, muy profesional y sin rodeos. Me explicaron el proceso completo.",
        ratings: [
          { aspectName: "trato", score: "4.50" },
          { aspectName: "rapidez", score: "3.50" },
        ],
      },
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Caso técnico relacionado con optimización de procesos mineros. Bien explicado y con tiempo razonable.",
        ratings: [
          { aspectName: "transparencia", score: "4.50" },
          { aspectName: "feedback", score: "4.00" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Entrevista con el superintendente del área. Preguntas técnicas pertinentes y un trato excelente.",
        ratings: [
          { aspectName: "trato", score: "5.00" },
          { aspectName: "transparencia", score: "4.00" },
        ],
      },
    ],
  },
  {
    companySlug: "codelco",
    role: "Supervisor de Operaciones",
    recommends: true,
    daysAgo: 70,
    comment: "Todo el proceso fue coordinado por un reclutador que estuvo siempre disponible. Desde la postulación a la oferta fueron 6 semanas muy ordenadas.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "Postulación vía portal estatal con respuesta en una semana y un cronograma claro.",
        ratings: [
          { aspectName: "rapidez", score: "4.00" },
          { aspectName: "feedback", score: "4.00" },
        ],
      },
      {
        stageSlug: "oferta-laboral",
        comment: "Oferta transparente con sueldo, bonos y turnos detallados. Sin letra chica.",
        ratings: [
          { aspectName: "transparencia", score: "4.50" },
          { aspectName: "trato", score: "5.00" },
        ],
      },
    ],
  },
  {
    companySlug: "metro-de-santiago",
    role: "Ingeniero de Sistemas",
    recommends: true,
    daysAgo: 9,
    comment: "Proceso transparente desde el inicio, con pruebas técnicas muy bien diseñadas. Me informaron del resultado final, algo poco habitual en el rubro.",
    stages: [
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Prueba técnica sobre sistemas de control de trenes. Clara y con un plazo adecuado.",
        ratings: [
          { aspectName: "rapidez", score: "3.50" },
          { aspectName: "feedback", score: "4.50" },
          { aspectName: "transparencia", score: "4.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Entrevista con el gerente de TI. Buen nivel técnico y trato cercano.",
        ratings: [
          { aspectName: "trato", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "metro-de-santiago",
    role: "Analista de Mantenimiento",
    recommends: false,
    daysAgo: 55,
    comment: "El proceso duró más de tres meses. Cada etapa demoraba semanas y la comunicación se cortaba. Al final me enteré del rechazo por el portal.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "La postulación quedó en revisión durante semanas sin ninguna respuesta.",
        ratings: [
          { aspectName: "rapidez", score: "1.50" },
          { aspectName: "feedback", score: "2.00" },
        ],
      },
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "La prueba fue correcta, pero no recibí notas sobre mi desempeño.",
        ratings: [
          { aspectName: "rapidez", score: "2.00" },
          { aspectName: "transparencia", score: "3.00" },
        ],
      },
    ],
  },
  {
    companySlug: "banco-de-chile",
    role: "Analista de Riesgo",
    recommends: true,
    daysAgo: 15,
    comment: "Proceso muy profesional y ordenado, con evaluaciones bien explicadas. El trato del área de talento fue excelente y mantuvieron la comunicación constante.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista con reclutamiento, muy clara y con fechas definidas para cada paso.",
        ratings: [
          { aspectName: "trato", score: "5.00" },
          { aspectName: "feedback", score: "4.00" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Entrevista técnica con el gerente de riesgo. Preguntas precisas y ambiente relajado.",
        ratings: [
          { aspectName: "transparencia", score: "4.00" },
          { aspectName: "trato", score: "4.50" },
        ],
      },
      {
        stageSlug: "oferta-laboral",
        comment: "Oferta entregada con todos los detalles del paquete de compensación.",
        ratings: [
          { aspectName: "rapidez", score: "4.00" },
        ],
      },
    ],
  },
  {
    companySlug: "entel",
    role: "Desarrollador Frontend",
    recommends: true,
    daysAgo: 30,
    comment: "La etapa técnica fue la mejor que he vivido: un caso real, con tiempo razonable y retroalimentación constructiva después. Todo muy transparente.",
    stages: [
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Challenge de frontend con un producto real de la empresa. Recibí una revisión detallada de mi código.",
        ratings: [
          { aspectName: "rapidez", score: "4.00" },
          { aspectName: "feedback", score: "5.00" },
          { aspectName: "transparencia", score: "4.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Revisión del challenge junto al equipo técnico. Se notó un ambiente colaborativo.",
        ratings: [
          { aspectName: "trato", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "banco-estado",
    role: "Ejecutivo de Cuentas",
    recommends: false,
    daysAgo: 40,
    comment: "Buena disposición del equipo, pero el proceso fue muy burocrático. Hubo que repetir documentación varias veces y las fechas se atrasaron.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista agradable y con buena disposición, pero sin plazos claros para continuar.",
        ratings: [
          { aspectName: "trato", score: "4.00" },
          { aspectName: "feedback", score: "2.50" },
        ],
      },
      {
        stageSlug: "oferta-laboral",
        comment: "La oferta se atrasó más de un mes por procesos internos y requería documentación repetida.",
        ratings: [
          { aspectName: "rapidez", score: "2.00" },
          { aspectName: "transparencia", score: "2.50" },
        ],
      },
    ],
  },
  {
    companySlug: "agrosuper",
    role: "Ingeniero de Producción",
    recommends: true,
    daysAgo: 25,
    comment: "Proceso ordenado y con fechas cumplidas. Me impresionó la claridad con la que comunicaron el sueldo y las condiciones desde el inicio.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "Respuesta rápida a la postulación y contacto directo con el reclutador.",
        ratings: [
          { aspectName: "rapidez", score: "4.00" },
          { aspectName: "transparencia", score: "4.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Entrevista con el jefe de planta. Condiciones laborales claras desde el primer momento.",
        ratings: [
          { aspectName: "trato", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "wom",
    role: "Especialista de Marketing Digital",
    recommends: true,
    daysAgo: 8,
    comment: "Proceso ágil y dinámico, muy acorde a la marca. Tres etapas en tres semanas y con comunicación por WhatsApp, lo que hizo todo más fluido.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista con reclutamiento vía videollamada, rápida y sin formalismos innecesarios.",
        ratings: [
          { aspectName: "rapidez", score: "4.50" },
          { aspectName: "trato", score: "4.50" },
        ],
      },
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Caso de campaña digital con devolución constructiva del equipo.",
        ratings: [
          { aspectName: "feedback", score: "4.00" },
        ],
      },
    ],
  },
  {
    companySlug: "enel-chile",
    role: "Ingeniero de Energías Renovables",
    recommends: true,
    daysAgo: 50,
    comment: "Un proceso muy estructurado, con un panel técnico que hizo preguntas pertinentes. Recibí respuesta definitiva tal como me lo indicaron.",
    stages: [
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Evaluación técnica sobre un proyecto solar real. Ejercicio desafiante y bien guiado.",
        ratings: [
          { aspectName: "transparencia", score: "4.50" },
          { aspectName: "feedback", score: "4.00" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Panel con el gerente de proyectos y dos ingenieros. Preguntas pertinentes y respeto absoluto.",
        ratings: [
          { aspectName: "trato", score: "5.00" },
          { aspectName: "rapidez", score: "4.00" },
        ],
      },
    ],
  },
  {
    companySlug: "sky-airline",
    role: "Agente de Call Center",
    recommends: false,
    daysAgo: 33,
    comment: "La primera parte fue rápida, pero luego estuve dos semanas sin noticias. La prueba fue sencilla pero la organización dejó que desear.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista inicial ágil y buena onda, pero sin claridad sobre los siguientes pasos.",
        ratings: [
          { aspectName: "rapidez", score: "3.00" },
          { aspectName: "feedback", score: "2.00" },
        ],
      },
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Simulación de atención al cliente. La prueba en sí fue sencilla, pero los tiempos de respuesta fueron lentos.",
        ratings: [
          { aspectName: "trato", score: "3.50" },
          { aspectName: "rapidez", score: "2.50" },
        ],
      },
    ],
  },
  {
    companySlug: "duoc-uc",
    role: "Docente Part-Time",
    recommends: true,
    daysAgo: 60,
    comment: "Proceso muy humano y con buena comunicación. Me explicaron el modelo educativo y las expectativas con total claridad antes de aceptar.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "Postulación respondida en pocos días con una entrevista programada de inmediato.",
        ratings: [
          { aspectName: "trato", score: "4.50" },
          { aspectName: "transparencia", score: "4.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Entrevista con el director de carrera. Conversación profunda sobre pedagogía y compromiso.",
        ratings: [
          { aspectName: "trato", score: "5.00" },
        ],
      },
    ],
  },
  {
    companySlug: "itau-chile",
    role: "Analista de Operaciones",
    recommends: true,
    daysAgo: 20,
    comment: "Proceso impecable: cronograma claro, entrevistadores preparados y feedback constructivo al finalizar. Se nota una cultura de excelencia.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Entrevista con reclutamiento muy ordenada, con el cronograma del proceso definido desde el día uno.",
        ratings: [
          { aspectName: "rapidez", score: "4.00" },
          { aspectName: "feedback", score: "4.50" },
        ],
      },
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Caso de operaciones bancarias con evaluación clara de criterios.",
        ratings: [
          { aspectName: "transparencia", score: "4.50" },
        ],
      },
      {
        stageSlug: "oferta-laboral",
        comment: "Oferta con explicación completa del paquete de beneficios y cultura interna.",
        ratings: [
          { aspectName: "trato", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "banco-santander",
    role: "Ejecutivo Comercial",
    recommends: true,
    daysAgo: 5,
    comment: "Proceso rápido y bien organizado. En dos semanas cerraron todo, con entrevistas presenciales y un excelente trato del equipo.",
    stages: [
      {
        stageSlug: "postulacion-enviada",
        comment: "Postulación confirmada al día siguiente con agenda de entrevistas incluida.",
        ratings: [
          { aspectName: "rapidez", score: "4.50" },
          { aspectName: "feedback", score: "3.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Entrevista presencial con el gerente de banca. Trato excelente y respuestas directas.",
        ratings: [
          { aspectName: "trato", score: "5.00" },
        ],
      },
      {
        stageSlug: "oferta-laboral",
        comment: "Oferta clara con sueldo base, comisiones y condiciones detalladas.",
        ratings: [
          { aspectName: "rapidez", score: "5.00" },
          { aspectName: "transparencia", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "mercado-libre",
    role: "Ingeniero de Datos",
    recommends: true,
    daysAgo: 28,
    comment: "El proceso más desafiante pero también el más claro. Evaluación técnica exigente con un caso real y respuestas detalladas en cada paso.",
    stages: [
      {
        stageSlug: "evaluacion-o-prueba-practica",
        comment: "Challenge de datos con datos reales de la plataforma. Exigente, pero con criterios de evaluación públicos.",
        ratings: [
          { aspectName: "rapidez", score: "4.00" },
          { aspectName: "feedback", score: "4.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Entrevista con el lead del equipo de datos. Nivel técnico alto y cultura de feedback.",
        ratings: [
          { aspectName: "transparencia", score: "4.50" },
          { aspectName: "trato", score: "4.50" },
        ],
      },
    ],
  },
  {
    companySlug: "bci",
    role: "Analista de Créditos",
    recommends: false,
    daysAgo: 75,
    comment: "Primero avanzó rápido, pero la etapa final se extendió más de un mes. Cambios de entrevistador y escasa claridad sobre el resultado.",
    stages: [
      {
        stageSlug: "entrevista-con-hr-o-reclutador",
        comment: "Primera entrevista rápida y con buen trato. Prometieron respuesta en una semana.",
        ratings: [
          { aspectName: "trato", score: "4.00" },
          { aspectName: "rapidez", score: "3.50" },
        ],
      },
      {
        stageSlug: "entrevista-con-el-lider-del-equipo-hiring-manager",
        comment: "Se reprogramó dos veces y el entrevistador cambió. La respuesta final llegó con más de un mes de atraso.",
        ratings: [
          { aspectName: "feedback", score: "2.00" },
          { aspectName: "transparencia", score: "2.50" },
        ],
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding categories...");
  for (const cat of seedCategories) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({ target: categories.slug, set: { name: cat.name } });
  }

  console.log("🌱 Seeding process_stages...");
  for (const stage of seedStages) {
    await db
      .insert(processStages)
      .values(stage)
      .onConflictDoUpdate({ target: processStages.slug, set: { name: stage.name } });
  }

  console.log("🌱 Seeding companies...");
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  for (const company of seedCompanies) {
    const categoryId = categoryMap.get(company.categorySlug);
    if (!categoryId) {
      console.warn(`⚠️  Category "${company.categorySlug}" not found, skipping ${company.name}`);
      continue;
    }
    await db
      .insert(companies)
      .values({
        name: company.name,
        slug: company.slug,
        description: company.description,
        location: company.location,
        categoryId,
        website: company.website ?? null,
        careersUrl: company.careersUrl ?? null,
      })
      .onConflictDoUpdate({
        target: companies.slug,
        set: {
          name: company.name,
          description: company.description,
          location: company.location,
          categoryId,
          website: company.website ?? null,
          careersUrl: company.careersUrl ?? null,
        },
      });
  }

  const seedReviewsEnabled = process.env.SEED_REVIEWS !== "false";

  if (seedReviewsEnabled) {
    console.log("🌱 Seeding reviews...");
    const allCompanies = await db.select().from(companies);
    const allStages = await db.select().from(processStages);
    const companyBySlug = new Map(allCompanies.map((c) => [c.slug, c.id]));
    const stageBySlug = new Map(allStages.map((s) => [s.slug, s.id]));

    for (const reviewData of seedReviews) {
      const companyId = companyBySlug.get(reviewData.companySlug);
      if (!companyId) {
        console.warn(`⚠️  Company "${reviewData.companySlug}" not found, skipping review`);
        continue;
      }

      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ id: reviews.id })
          .from(reviews)
          .where(and(eq(reviews.companyId, companyId), eq(reviews.ipHash, "seed"), eq(reviews.comment, reviewData.comment)))
          .limit(1);

        let reviewId: string;
        if (existing) {
          reviewId = existing.id;
          await tx
            .update(reviews)
            .set({ role: reviewData.role, recommends: reviewData.recommends, createdAt: daysAgo(reviewData.daysAgo) })
            .where(eq(reviews.id, reviewId));

          const oldStages = await tx
            .select({ id: stageReviews.id })
            .from(stageReviews)
            .where(eq(stageReviews.reviewId, reviewId));
          for (const s of oldStages) {
            await tx.delete(aspectRating).where(eq(aspectRating.stageReviewId, s.id));
          }
          await tx.delete(stageReviews).where(eq(stageReviews.reviewId, reviewId));
        } else {
          const [review] = await tx
            .insert(reviews)
            .values({ companyId, ipHash: "seed", role: reviewData.role, recommends: reviewData.recommends, comment: reviewData.comment, createdAt: daysAgo(reviewData.daysAgo) })
            .returning({ id: reviews.id });
          reviewId = review.id;
        }

        for (const sr of reviewData.stages) {
          const stageId = stageBySlug.get(sr.stageSlug);
          if (!stageId) {
            console.warn(`⚠️  Stage "${sr.stageSlug}" not found, skipping`);
            continue;
          }

          const [stageReview] = await tx
            .insert(stageReviews)
            .values({ reviewId, stageId, comment: sr.comment })
            .returning({ id: stageReviews.id });

          for (const r of sr.ratings) {
            await tx
              .insert(aspectRating)
              .values({ stageReviewId: stageReview.id, aspectName: r.aspectName, score: r.score });
          }
        }
      });
    }
  } else {
    console.log("⏭️  Seeding de reviews desactivado (SEED_REVIEWS=false)");
  }

  console.log("🧹 Limpiando etapas obsoletas...");
  const catalogSlugs = new Set(seedStages.map((s) => s.slug));
  const stagesToCheck = await db.select().from(processStages);
  for (const st of stagesToCheck) {
    if (catalogSlugs.has(st.slug)) continue;
    const [{ refs }] = await db
      .select({ refs: sql<number>`count(*)::int` })
      .from(stageReviews)
      .where(eq(stageReviews.stageId, st.id));
    if (refs === 0) {
      await db.delete(processStages).where(eq(processStages.id, st.id));
      console.log(`🗑️  Eliminada etapa obsoleta "${st.name}"`);
    } else {
      console.warn(`⚠️  Etapa "${st.name}" tiene ${refs} stage_reviews; no se elimina`);
    }
  }

  console.log("✅ Seed completado");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
