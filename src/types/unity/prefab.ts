export interface HierarchyNode {
	name: string;
	type: Type;
	is_active: number;
	transform: Transform;
	sprite_renderer: SpriteRenderer | null;
	animator: Animator | null;
	particle_system: ParticleSystem | null;
	animation_clips: string[] | null;
	mono_behaviours: MonoBehaviour[];
	children: HierarchyNodeChild[];
}

export interface Animator {
	enabled: number;
	controllerGuid: string;
}

export interface HierarchyNodeChild {
	name: string;
	type: Type;
	is_active: number;
	transform: Transform;
	sprite_renderer: SpriteRenderer | null;
	animator: null;
	mono_behaviours: object[];
	children: ChildChild[];
}

export interface ChildChild {
	name: string;
	type: Type;
	is_active: number;
	transform: Transform;
	sprite_renderer: SpriteRenderer | null;
	animator: null;
	mono_behaviours: object[];
	children: ChildChild[];
}

export interface SpriteRenderer {
	color: Color;
	size: Size;
	spriteGuid: string;
	spriteBase64: string;
	spriteRect: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	sortingOrder: number;
	flipX: number;
	flipY: number;
	offset: { x: number; y: number };
}

export interface Color {
	a: number;
	b: number;
	g: number;
	r: number;
}

export interface Size {
	x: number;
	y: number;
}

export interface Transform {
	localPosition: Local;
	localScale: Local;
	localRotation: Local;
	localEulerAnglesHint: Local;
	fatherId: number;
	childrenIds: number[];
}

export interface Local {
	x: number;
	y: number;
	z: number;
	w: number | null;
}

export enum Type {
	GameObject = 'GameObject',
}

export interface MonoBehaviour {
	unitId: number | null;
	isUi: number | null;
	pauseUpdateUi: number | null;
	scriptGuid: string;
}

// Animation interfaces
export interface AnimationController {
	fileId: number;
	guid: string;
	controllerType: number;
}

export interface AnimationClip {
	m_Name: string;
	m_Legacy: number;
	m_Compressed: number;
	m_UseHighQualityCurve: number;
	m_RotationCurves: RotationCurve[];
	m_EulerCurves: EulerCurve[];
	m_PositionCurves: PositionCurve[];
	m_ScaleCurves: ScaleCurve[];
	m_FloatCurves: FloatCurve[];
	m_SampleRate?: number;
	m_WrapMode: number;
	m_Bounds: AnimationBounds;
	m_Events: AnimationEvent[];
	m_AnimationClipSettings?: AnimationClipSettings;
}

export interface AnimationClipSettings {
	m_StartTime: number;
	m_StopTime: number;
	m_OrientationOffsetY: number;
	m_Level: number;
	m_CycleOffset: number;
}

export interface RotationCurve {
	curve: AnimationCurve;
	path: string;
}

export interface EulerCurve {
	curve: AnimationCurve;
	path: string;
}

export interface PositionCurve {
	curve: AnimationCurve;
	path: string;
}

export interface ScaleCurve {
	curve: AnimationCurve;
	path: string;
}

export interface FloatCurve {
	curve: AnimationCurve;
	path: string;
	attribute: string;
	classId: number;
}

export interface AnimationCurve {
	serializedVersion: number;
	curve: Keyframe[];
	preInfinity: number;
	postInfinity: number;
	rotationOrder: number;
}

export interface Keyframe {
	serializedVersion: number;
	time: number;
	value: number;
	inSlope: number;
	outSlope: number;
	tangentMode: number;
	weightedMode: number;
	inWeight: number;
	outWeight: number;
}

export interface AnimationBounds {
	center: { x: number; y: number };
	extent: { x: number; y: number };
}

export interface AnimationEvent {
	time: number;
	functionName: string;
	data: string;
	floatParameter: number;
	intParameter: number;
	messageOptions: number;
}

// Particle System interfaces
export interface ParticleSystem {
	enabled: number;
	lengthInSec: number;
	simulationSpeed: number;
	looping: number;
	prewarm: number;
	playOnAwake: number;
	autoRandomSeed: number;
	startLifetime: number;
	startSpeed: number;
	startSize: number;
	startColor: Color;
	gravityModifier: number;
	emissionRate: number;
	shapeType: number;
}

export interface MinMaxCurve {
	serializedVersion: number;
	minMaxState: number;
	scalar: number;
	minScalar: number;
	maxCurve: AnimationCurve;
	minCurve: AnimationCurve;
}

export interface MinMaxGradient {
	serializedVersion: number;
	minMaxState: number;
	minColor: Color;
	maxColor: Color;
	maxGradient: Gradient;
	minGradient: Gradient;
}

export interface Gradient {
	serializedVersion: number;
	mode: number;
	numColorKeys: number;
	numAlphaKeys: number;
	colorKeys: GradientColorKey[];
	alphaKeys: GradientAlphaKey[];
}

export interface GradientColorKey {
	color: Color;
	time: number;
}

export interface GradientAlphaKey {
	alpha: number;
	time: number;
}

export interface ParticleShape {
	serializedVersion: number;
	enabled: number;
	shapeType: number;
	angle: number;
	length: number;
	position: { x: number; y: number };
	rotation: { x: number; y: number };
	scale: { x: number; y: number };
}

export interface ParticleEmission {
	serializedVersion: number;
	enabled: number;
	rateOverTime: MinMaxCurve;
	rateOverDistance: MinMaxCurve;
	bursts: ParticleBurst[];
}

export interface ParticleBurst {
	serializedVersion: number;
	time: number;
	countCurve: MinMaxCurve;
	cycleCount: number;
	repeatInterval: number;
	probability: number;
}
