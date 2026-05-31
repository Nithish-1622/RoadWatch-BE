{{- define "postgres.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "postgres.fullname" -}}
{{- printf "%s-%s" (include "postgres.name" .) .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
