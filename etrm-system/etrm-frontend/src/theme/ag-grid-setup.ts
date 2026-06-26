import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

/**
 * AG Grid v32+ requires explicit module registration before any <AgGridReact>
 * renders, or grids fail at runtime with "No row model registered". Using
 * AllCommunityModule (every Community-tier feature) for now since the
 * scaffold doesn't yet know which specific features each future grid will
 * need — narrow this to only the modules actually used once there are
 * enough real grids to know the footprint cost is worth trimming.
 */
ModuleRegistry.registerModules([AllCommunityModule]);
