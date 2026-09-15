# Presenter cue sheet

For an action-by-action view with code diffs and copy buttons, run
`pnpm workshop:notes` and open http://localhost:4400.

Keep the [demo prompt sequence](demo-prompts.md) available for ready-to-copy questions, setup and expected results.

Open this while presenting; follow the linked notes for exact files and prompts.
Recovery for each row: `pnpm workshop:select NN`, restart affected services, reload
the browser. This restores code only; existing alarms/audit/data remain.

| Milestone | Say / explain                                                           | Do live                                                                       | Show the evidence                                                           | Notes                                      |
| --------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| 01        | The application already owns state and actions.                         | No code; tour snapshot, filters, history, manual alarms.                      | UI state and persisted readings.                                            | [01](speaker-notes/01-conventional-app.md) |
| 02        | Conversation alone gives no access to facility data.                    | Connect prepared native chat to the model service.                            | `/api/chat`; ordinary answer versus unavailable facility knowledge.         | [02](speaker-notes/02-basic-chat.md)       |
| 03        | AG-UI carries the agent run; CopilotKit hosts the interaction.          | Swap in CopilotChat, provider and embedded runtime.                           | Streaming request and lifecycle events; still no tools.                     | [03](speaker-notes/03-copilotkit.md)       |
| 04        | Agent implementation can move behind the same frontend boundary.        | Connect Mastra bridge; inspect the small agent factory.                       | The same app request in Studio traces.                                      | [04](speaker-notes/04-mastra.md)           |
| 05        | Tools connect model intent to existing UI operations.                   | Connect bounded context and seven prepared registrations.                     | Filter change; unrelated filters survive.                                   | [05](speaker-notes/05-frontend-tools.md)   |
| 06        | A model proposes SQL; policy controls execution.                        | Register historian tool and workflow; display is already connected.           | Workflow trace, returned records, fixed-grid limit.                         | [06](speaker-notes/06-historian.md)        |
| 07        | A proposal does not authorize a state change.                           | Register the prepared approval card and update agent instructions.            | Reject, approve, actual alarm and correlated audit.                         | [07](speaker-notes/07-approval.md)         |
| 08        | A model arranges supplied components; application data supplies values. | Connect catalogue, chat notice, composition workflow/tool and dataset policy. | Standalone table → manager Cards with room Tables → room-description Cards. | [08](speaker-notes/08-a2ui.md)             |

In 08, explicitly contrast the new workflow order and full-dataset result contract
with 06. A2A and MCP remain [future additions](readiness.md).
