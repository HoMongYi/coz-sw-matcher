import {McpServer} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import {z} from 'zod';
import {parseProductName} from '../parser/compuzone-name-parser.mjs';
import {approvalContract} from '../approvals/approval-contract.mjs';
const candidate=z.object({url:z.string().max(4096),title:z.string().max(1000).optional(),snippet:z.string().max(4000).optional()}).strict();
const input=z.object({product_no:z.string().max(200).optional(),product_name:z.string().min(1).max(1000),requested_software_kind:z.enum(['driver','firmware','control-app','web-driver','toolbox','utility','support']).optional(),candidates:z.array(candidate).max(5).optional(),target_component:z.number().int().min(0).optional()}).strict();
export function createMatcherMcpServer(matcher,{allowOnline=false}={}){
 const server=new McpServer({name:'coz-sw-matcher',version:'0.2.0'});
 const register=(name,description,inputSchema,handler,online=false)=>server.registerTool(name,{description,inputSchema,outputSchema:z.object({}).passthrough(),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:!online,openWorldHint:online}},async args=>{
  try{const value=await handler(args);return{content:[{type:'text',text:JSON.stringify(value)}],structuredContent:value};}catch{return{content:[{type:'text',text:'INVALID_REQUEST'}],isError:true};}
 });
 register('match_official_software_candidates','Return 0–5 official software URL candidates. Human approval is required.',input.shape,args=>matcher.match(args));
 register('parse_compuzone_product','Preserve raw name, model variants, promotion, distributor and bundle components.',{product_name:z.string().min(1).max(1000)},args=>parseProductName(args,{vendors:matcher.registry.vendors}));
 register('get_approval_contract','Read the host-owned approval contract; this server does not store approvals.',{},()=>approvalContract);
 if(allowOnline)register('research_official_software_candidates','Explicit bounded online page verification and optional paid search/ranking.',input.shape,args=>matcher.match(args,{online:true}),true);
 return server;
}
export async function startMatcherMcp(matcher,options={}){const server=createMatcherMcpServer(matcher,options);await server.connect(new StdioServerTransport(process.stdin,process.stdout,{maxBufferSize:1_048_576}));return server;}
