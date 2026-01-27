import { SupportedProtocol, Writer } from './types';
export declare function load(type: SupportedProtocol, rpc: string): Promise<Writer<SupportedProtocol>>;
