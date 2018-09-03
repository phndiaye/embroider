import V1InstanceCache from './v1-instance-cache';
import { Tree } from 'broccoli-plugin';
import AppEntrypoint from './app-entrypoint';
import Package from './package';
import V1App from './v1-app';
import PackageCache from './package-cache';
import { TrackedImport } from './tracked-imports';
import Workspace from './workspace';
import WorkspaceUpdater from './workspace-updater';

export default class App extends Package {
  private oldPackage: V1App;
  protected packageCache: PackageCache;

  constructor(public originalRoot: string, v1Cache: V1InstanceCache, private outputDir: string) {
    super(originalRoot);
    this.packageCache = new PackageCache(v1Cache);
    this.oldPackage = v1Cache.app;
  }

  get name(): string {
    return this.oldPackage.name;
  }

  get implicitImports(): TrackedImport[] {
    return this.oldPackage.trackedImports;
  }

  // This is the end of the Vanilla build pipeline -- this is the tree that we
  // can hand off to an arbitrary Javascript packager.
  get vanillaTree(): Tree {
    let workspace = new Workspace(this, this.outputDir);

    // We need to smoosh all the app trees together. This is unavoidable until
    // everybody goes MU.
    let appJSFromAddons = this.activeDescendants.map(d => d.legacyAppTree).filter(Boolean);
    let { appJS, analyzer } = this.oldPackage.processAppJS(appJSFromAddons, this.originalPackageJSON);

    // And we generate the actual entrypoint files.
    let entry = new AppEntrypoint(workspace, appJS, this, analyzer);

    return new WorkspaceUpdater([appJS, entry], workspace);
  }

  get appJSPath() {
    return this.oldPackage.appJSPath;
  }

  protected dependencyKeys = ['dependencies', 'devDependencies'];

  get dependedUponBy() {
    return new Set();
  }
}