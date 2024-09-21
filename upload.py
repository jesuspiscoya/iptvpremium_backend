import os
import re
import mysql.connector as mysql
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()


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
                        'id': tvg_id,
                        'name': tvg_name,
                        'logo': tvg_logo,
                        'url': url
                    })

    return channels


def insert_channels(channels):
    for channel in channels:
        try:
            conn = mysql.connect(
                host=os.getenv("DB_HOST"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                database=os.getenv("DB_NAME"),
                port=os.getenv("DB_PORT")
            )
            cur = conn.cursor()

            SQL = """
                INSERT INTO channels (channel_id, name, logo, url)
                VALUES (%s, %s, %s, %s)
            """
            variables = (
                channel['id'],
                channel['name'],
                channel['logo'],
                channel['url']
            )
            cur.execute(SQL, variables)
            # Confirmar los cambios
            conn.commit()
            print("Datos insertados correctamente.")
        except Error as e:
            print(f"Error al conectar a la base de datos: {e}")
        finally:
            if cur is not None:
                cur.close()
            if conn is not None:
                conn.close()


# Parsear el archivo
channels = parse_m3u_file('jesus.m3u')

# Imprimir los resultados
insert_channels(channels)
