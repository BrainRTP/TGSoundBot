import * as fs from 'fs';
import { WriteStream } from 'fs';
import * as path from 'path';
import { BotConfig } from '../config/BotConfig';
import {SavedSoundFile} from './types/type';
import {ILogger} from "js-logger";
import {createLogger} from "./logger/logger";

export class FileWriter {
    private readonly logger: ILogger = createLogger('FileWriter');
    private readonly oggFilesDir: string;

    constructor(config: BotConfig) {
        this.oggFilesDir = config.getConfig()?.tempFileDir || 'oggFiles';
        fs.mkdirSync(path.resolve(this.oggFilesDir), { recursive: true });
    }

    public writeFile(fileName: string, fileId: string, fileStream: NodeJS.ReadableStream): Promise<SavedSoundFile> {
        return new Promise((resolve, reject) => {
            const filePath = path.resolve(this.oggFilesDir, `${fileName}-${fileId}.ogg`);
            const fileIS: WriteStream = fs.createWriteStream(filePath);

            fileStream
                .on('data', (chunk: any) => {
                    fileIS.write(chunk);
                })
                .on('close', () => {
                    fileIS.end();
                    resolve({ filePath, fileName, fileId });
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    }

    public deleteFile(savedSoundFile: SavedSoundFile): void {
        const filePath = path.resolve(this.oggFilesDir, `${savedSoundFile.fileName}-${savedSoundFile.fileId}.ogg`);
        fs.unlink(filePath, (err) => {
            if (err) {
                this.logger.error(`Ошибка при удалении файла: ${filePath}`, err);
            } else {
                this.logger.debug(`Файл успешно удален: ${filePath}`);
            }
        });
    }
}
