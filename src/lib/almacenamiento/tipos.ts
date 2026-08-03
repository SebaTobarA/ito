export interface ArchivoGuardado {
  /** Clave interna del archivo en el almacenamiento. Nunca se expone al navegador. */
  clave: string;
  bytes: number;
}

export interface AdaptadorAlmacenamiento {
  nombre: string;
  guardar(archivo: File, ruta: string): Promise<ArchivoGuardado>;
  /** Contenido del archivo, para servirlo desde una ruta que verifica permisos. */
  leer(clave: string): Promise<ReadableStream<Uint8Array> | Buffer>;
  eliminar(clave: string): Promise<void>;
}
