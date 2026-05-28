import React from 'react';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconDownload,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconInfoCircle,
  IconMap,
  IconMenu2,
  IconMessageCircle,
  IconTrash,
  IconUsers,
  IconUser,
  IconX,
  type IconProps,
} from '@tabler/icons-react-native';

export type AppIconName =
  | 'alert'
  | 'back'
  | 'calendar'
  | 'check'
  | 'checkCircle'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'clock'
  | 'close'
  | 'closeCircle'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eyeOff'
  | 'fileText'
  | 'info'
  | 'map'
  | 'menu'
  | 'message'
  | 'trash'
  | 'user'
  | 'users';

type AppIconProps = Omit<IconProps, 'name'> & {
  name: AppIconName;
};

const iconMap = {
  alert: IconAlertCircle,
  back: IconArrowLeft,
  calendar: IconCalendar,
  check: IconCheck,
  checkCircle: IconCircleCheck,
  chevronDown: IconChevronDown,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  clock: IconClock,
  close: IconX,
  closeCircle: IconCircleX,
  download: IconDownload,
  edit: IconEdit,
  eye: IconEye,
  eyeOff: IconEyeOff,
  fileText: IconFileText,
  info: IconInfoCircle,
  map: IconMap,
  menu: IconMenu2,
  message: IconMessageCircle,
  trash: IconTrash,
  user: IconUser,
  users: IconUsers,
} as const;

export function AppIcon({ name, size = 20, strokeWidth = 2, ...props }: AppIconProps) {
  const Icon = iconMap[name];

  return <Icon size={size} strokeWidth={strokeWidth} {...props} />;
}
