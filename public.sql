--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2

-- Started on 2025-02-23 17:48:31 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 24600)
-- Name: allergen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allergen (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.allergen OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24599)
-- Name: allergen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.allergen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.allergen_id_seq OWNER TO postgres;

--
-- TOC entry 3415 (class 0 OID 0)
-- Dependencies: 221
-- Name: allergen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.allergen_id_seq OWNED BY public.allergen.id;


--
-- TOC entry 226 (class 1259 OID 24632)
-- Name: drink_allergen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drink_allergen (
    drink_id integer NOT NULL,
    allergen_id integer NOT NULL
);


ALTER TABLE public.drink_allergen OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24624)
-- Name: drinks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drinks (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    ingredients text NOT NULL,
    price numeric(10,2) NOT NULL,
    category character varying(255)
);


ALTER TABLE public.drinks OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24623)
-- Name: drinks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drinks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drinks_id_seq OWNER TO postgres;

--
-- TOC entry 3416 (class 0 OID 0)
-- Dependencies: 224
-- Name: drinks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drinks_id_seq OWNED BY public.drinks.id;


--
-- TOC entry 220 (class 1259 OID 24591)
-- Name: food; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    ingredients text NOT NULL,
    price numeric(10,2) NOT NULL,
    category character varying(255)
);


ALTER TABLE public.food OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24608)
-- Name: food_allergen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food_allergen (
    food_id integer NOT NULL,
    allergen_id integer NOT NULL
);


ALTER TABLE public.food_allergen OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24647)
-- Name: food_and_drink_allergens; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.food_and_drink_allergens AS
 SELECT 'Food'::text AS category,
    f.name AS item,
    a.name AS allergen
   FROM ((public.food f
     JOIN public.food_allergen fa ON ((f.id = fa.food_id)))
     JOIN public.allergen a ON ((fa.allergen_id = a.id)))
UNION ALL
 SELECT 'Drink'::text AS category,
    d.name AS item,
    a.name AS allergen
   FROM ((public.drinks d
     JOIN public.drink_allergen da ON ((d.id = da.drink_id)))
     JOIN public.allergen a ON ((da.allergen_id = a.id)));


ALTER VIEW public.food_and_drink_allergens OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24590)
-- Name: food_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.food_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.food_id_seq OWNER TO postgres;

--
-- TOC entry 3417 (class 0 OID 0)
-- Dependencies: 219
-- Name: food_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.food_id_seq OWNED BY public.food.id;


--
-- TOC entry 218 (class 1259 OID 16395)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    hashedpassword character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16394)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3418 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 229 (class 1259 OID 32773)
-- Name: wine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wine (
    id integer NOT NULL,
    name text NOT NULL,
    origin text NOT NULL,
    category text NOT NULL,
    glass_price numeric(10,2),
    small_price numeric(10,2),
    medium_price numeric(10,2),
    large_price numeric(10,2),
    bottle_price numeric(10,2)
);


ALTER TABLE public.wine OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 32772)
-- Name: wine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wine_id_seq OWNER TO postgres;

--
-- TOC entry 3419 (class 0 OID 0)
-- Dependencies: 228
-- Name: wine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wine_id_seq OWNED BY public.wine.id;


--
-- TOC entry 3237 (class 2604 OID 24603)
-- Name: allergen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allergen ALTER COLUMN id SET DEFAULT nextval('public.allergen_id_seq'::regclass);


--
-- TOC entry 3238 (class 2604 OID 24627)
-- Name: drinks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drinks ALTER COLUMN id SET DEFAULT nextval('public.drinks_id_seq'::regclass);


--
-- TOC entry 3236 (class 2604 OID 24594)
-- Name: food id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food ALTER COLUMN id SET DEFAULT nextval('public.food_id_seq'::regclass);


--
-- TOC entry 3234 (class 2604 OID 16398)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 32776)
-- Name: wine id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wine ALTER COLUMN id SET DEFAULT nextval('public.wine_id_seq'::regclass);


--
-- TOC entry 3249 (class 2606 OID 24607)
-- Name: allergen allergen_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allergen
    ADD CONSTRAINT allergen_name_key UNIQUE (name);


--
-- TOC entry 3251 (class 2606 OID 24605)
-- Name: allergen allergen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allergen
    ADD CONSTRAINT allergen_pkey PRIMARY KEY (id);


--
-- TOC entry 3257 (class 2606 OID 24636)
-- Name: drink_allergen drink_allergen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drink_allergen
    ADD CONSTRAINT drink_allergen_pkey PRIMARY KEY (drink_id, allergen_id);


--
-- TOC entry 3255 (class 2606 OID 24631)
-- Name: drinks drinks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drinks
    ADD CONSTRAINT drinks_pkey PRIMARY KEY (id);


--
-- TOC entry 3253 (class 2606 OID 24612)
-- Name: food_allergen food_allergen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_allergen
    ADD CONSTRAINT food_allergen_pkey PRIMARY KEY (food_id, allergen_id);


--
-- TOC entry 3247 (class 2606 OID 24598)
-- Name: food food_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food
    ADD CONSTRAINT food_pkey PRIMARY KEY (id);


--
-- TOC entry 3241 (class 2606 OID 16407)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3243 (class 2606 OID 16403)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3245 (class 2606 OID 16405)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3259 (class 2606 OID 32780)
-- Name: wine wine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wine
    ADD CONSTRAINT wine_pkey PRIMARY KEY (id);


--
-- TOC entry 3262 (class 2606 OID 24642)
-- Name: drink_allergen drink_allergen_allergen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drink_allergen
    ADD CONSTRAINT drink_allergen_allergen_id_fkey FOREIGN KEY (allergen_id) REFERENCES public.allergen(id) ON DELETE CASCADE;


--
-- TOC entry 3263 (class 2606 OID 24637)
-- Name: drink_allergen drink_allergen_drink_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drink_allergen
    ADD CONSTRAINT drink_allergen_drink_id_fkey FOREIGN KEY (drink_id) REFERENCES public.drinks(id) ON DELETE CASCADE;


--
-- TOC entry 3260 (class 2606 OID 24618)
-- Name: food_allergen food_allergen_allergen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_allergen
    ADD CONSTRAINT food_allergen_allergen_id_fkey FOREIGN KEY (allergen_id) REFERENCES public.allergen(id) ON DELETE CASCADE;


--
-- TOC entry 3261 (class 2606 OID 24613)
-- Name: food_allergen food_allergen_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_allergen
    ADD CONSTRAINT food_allergen_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.food(id) ON DELETE CASCADE;


-- Completed on 2025-02-23 17:48:31 UTC

--
-- PostgreSQL database dump complete
--

