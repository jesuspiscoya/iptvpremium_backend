import re
import psycopg2
from psycopg2 import OperationalError


def parse_m3u_file(file_path):
    channels = []

    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    for i, line in enumerate(lines):
        line = line.strip()

        # Línea de metadatos (empieza con #EXTINF)
        if line.startswith('#EXTINF:'):
            # Extraer metadatos usando expresión regular
            match = re.search(
                r'tvg-id="([^"]*)".*?tvg-name="([^"]*)".*?tvg-logo="([^"]*)"', line)
            if match:
                tvg_id = match.group(1)
                tvg_name = match.group(2)
                tvg_logo = match.group(3)

                # La URL está en la línea siguiente
                if i + 1 < len(lines):
                    url = lines[i + 1].strip()
                    channels.append({
                        'tvg-id': tvg_id,
                        'tvg-name': tvg_name,
                        'tvg-logo': tvg_logo,
                        'url': url
                    })

    return channels


def insert_channels(channels):
    for channel in channels:
        try:
            conn = psycopg2.connect(
                dbname="postgres",
                user="postgres.chuybyigpezlravbgpkd",
                password="dPFmUmuKs0fWuy0Z",
                host="aws-0-sa-east-1.pooler.supabase.com",
                port="5432"
            )
            cur = conn.cursor()

            SQL = """
                INSERT INTO channels (channel_id, name, logo, url)
                VALUES (%s, %s, %s, %s)
            """
            variables = (
                channel['tvg-id'],
                channel['tvg-name'],
                channel['tvg-logo'],
                channel['url']
            )
            cur.execute(SQL, variables)
            # Confirmar los cambios
            conn.commit()
            print("Datos insertados correctamente.")
        except OperationalError as e:
            print(f"Error al conectar a la base de datos: {e}")
        finally:
            if cur is not None:
                cur.close()
            if conn is not None:
                conn.close()


# Ruta al archivo .m3u
file_path = 'jesus.m3u'

# Parsear el archivo
channels = parse_m3u_file(file_path)

# Imprimir los resultados
insert_channels(channels)
