export abstract class Plugin {
  abstract name: string;
  abstract version: string;

  abstract install(): void;
  abstract uninstall(): void;
}
