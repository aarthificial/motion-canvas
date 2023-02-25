import {CanvasOutputMimeType} from '../types';
import {Exporter} from './Exporter';
import {Logger} from './Logger';
import {RendererResult, RendererSettings} from './Renderer';

const EXPORT_FRAME_LIMIT = 256;
const EXPORT_RETRY_DELAY = 1000;

/**
 * Image sequence exporter.
 */
export class ImageExporter implements Exporter {
  private readonly frameLookup = new Set<number>();
  private name = 'unknown';
  private quality = 1;
  private fileType: CanvasOutputMimeType = 'image/png';

  public constructor(private readonly logger: Logger) {
    if (import.meta.hot) {
      import.meta.hot.on('motion-canvas:export-ack', ({frame}) => {
        this.frameLookup.delete(frame);
      });
    }
  }

  public async configure(settings: RendererSettings) {
    this.name = settings.name;
    this.quality = settings.quality;
    this.fileType = settings.fileType;
  }

  public async start() {
    this.frameLookup.clear();
  }

  public async handleFrame(
    canvas: HTMLCanvasElement,
    frame: number,
    signal: AbortSignal,
  ) {
    if (this.frameLookup.has(frame)) {
      this.logger.warn(`Frame no. ${frame} is already being exported.`);
      return;
    }
    if (import.meta.hot) {
      while (this.frameLookup.size > EXPORT_FRAME_LIMIT) {
        await new Promise(resolve => setTimeout(resolve, EXPORT_RETRY_DELAY));
        if (signal.aborted) {
          return;
        }
      }

      this.frameLookup.add(frame);
      (async () => {
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            blob => {
              if (blob === null) {
                reject();
              } else {
                resolve(blob);
              }
            },
            this.fileType,
            this.quality,
          ),
        );
        if (signal.aborted) return;

        // TODO Figure out the optimal way of sending a blob to node.
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => {
            resolve(e.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (signal.aborted) return;

        import.meta.hot!.send('motion-canvas:export', {
          frame,
          isStill: false,
          data,
          mimeType: this.fileType,
          project: this.name,
        });
      })().catch(e => {
        this.frameLookup.delete(frame);
        this.logger.error(e);
      });
    }
  }

  public async stop(result: RendererResult) {
    console.log(result);
    if (result === RendererResult.Success) {
      while (this.frameLookup.size > 0) {
        await new Promise(resolve => setTimeout(resolve, EXPORT_RETRY_DELAY));
      }
    }
    this.frameLookup.clear();
  }
}
