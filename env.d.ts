/* eslint-disable */
declare namespace Cloudflare {
	interface GlobalProps {
		mainModule: typeof import("./src/server");
		durableNamespaces: "AlgorithmCoach";
	}
	interface Env {
		AlgorithmCoach: DurableObjectNamespace<import("./src/server").AlgorithmCoach>;
		AI: Ai;
	}
}
interface Env extends Cloudflare.Env {}
type StringifyValues<EnvType extends Record<string, unknown>> = {
	[Binding in keyof EnvType]: EnvType[Binding] extends string ? EnvType[Binding] : string;
};
